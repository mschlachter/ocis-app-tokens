<template>
  <!-- documentation for components: https://owncloud.design/#/oC%20Components -->
  <main class="oc-mt-m oc-mb-l oc-flex oc-flex-center app-content oc-width-1-1">
    <div class="tokens-page">
      <h1>App Tokens</h1>
      <p>
        Please ensure the
        <a
          href="https://doc.owncloud.com/ocis/next/deployment/services/s-list/auth-app.html"
          target="_blank"
          >Auth App Service</a
        >
        is enabled and configured before using this plugin.
      </p>
      <h2>Create Token</h2>
      <form id="create-token-form">
        <!-- Custom labels don't seem to be supported by API yet -->
        <oc-text-input
          v-model="create_token_label"
          label="Label (Optional)"
          class="oc-mb oc-hidden"
        />
        <oc-text-input
          v-model="create_token_expiry"
          label="Expires"
          description-message="Enter a duration as an number followed by either 'h', 'm', or 's', such as '72h'."
          default-value="72h"
          :error-message="create_token_error"
          class="oc-mb"
        />
        <oc-button variation="primary" class="oc-mb" @click="saveToken"> Create </oc-button>
      </form>
      <h2>Existing tokens</h2>
      <oc-table :fields="tokenTableFields" :data="tokens" :sticky="true">
        <template #footer> {{ tokens.length || 0 }} tokens </template>
        <template #created_date="rowData">
          <span :title="rowData.item.created_date">{{ rowData.item.created_date_pretty }}</span>
        </template>
        <template #expiration_date="rowData">
          <span :title="rowData.item.expiration_date">{{
            rowData.item.expiration_date_pretty
          }}</span>
        </template>
        <template #action="rowData">
          <oc-button size="small" variant="danger" @click="deleteToken(rowData)">Delete</oc-button>
        </template>
      </oc-table>
    </div>
  </main>
  <oc-modal
    v-if="showCreatedModal"
    variation="success"
    icon="checkbox-circle"
    title="Token created"
    :message="`Token created, set to expire ${createdToken.expiration_date}. Copy token now, this is the only time you will be shown the raw token: ${createdToken.token}`"
    button-cancel-text="Close"
    button-confirm-text="Copy to clipboard"
    button-confirm-appearance="filled"
    button-confirm-variation="success"
    @confirm="copyNewToken"
    @cancel="closeDialog"
  />
  <oc-modal
    v-if="showDeleteModal"
    variation="danger"
    icon="alert"
    title="Delete token"
    message="Are you sure you want to delete this token? All applications using this token will lose access."
    button-cancel-text="Cancel"
    button-confirm-text="Delete"
    button-confirm-appearance="filled"
    button-confirm-variation="danger"
    @confirm="confirmDelete"
    @cancel="closeDialog"
  />
  <oc-notifications position="top-right">
    <oc-notification-message
      v-for="item in notifications"
      :key="item.title"
      :status="item.status"
      :title="item.title"
      :message="item.message"
      :timeout="item.timeout"
      @close="removeNotification(item)"
    />
  </oc-notifications>
</template>

<script lang="ts">
import { Auth, useAuthStore } from '@ownclouders/web-pkg'
import TimeAgo from 'javascript-time-ago'

// English locale added to pretty times
import en from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(en)

export default {
  data() {
    return {
      tokens: [],
      tokenTableFields: [
        {
          name: 'label',
          title: 'Label',
          alignH: 'left'
        },
        {
          name: 'created_date',
          title: 'Created',
          alignH: 'left',
          type: 'slot'
        },
        {
          name: 'expiration_date',
          title: 'Expires',
          alignH: 'left',
          type: 'slot'
        },
        {
          name: 'token',
          title: 'Encrypted Token',
          alignH: 'left'
        },
        {
          name: 'action',
          title: '',
          type: 'slot',
          width: 'shrink'
        }
      ],
      create_token_label: null,
      create_token_expiry: null,
      create_token_error: null,
      showCreatedModal: false,
      createdToken: null,
      showDeleteModal: false,
      tokenToDelete: null,
      notifications: []
    }
  },
  created: function () {
    this.getTokens()
  },
  methods: {
    getTokens() {
      const authStore = useAuthStore()
      const auth = new Auth({
        accessToken: authStore.accessToken,
        publicLinkToken: authStore.publicLinkToken,
        publicLinkPassword: authStore.publicLinkPassword
      })

      fetch('/auth-app/tokens', {
        headers: auth.getHeaders()
      }).then((apiResponse) => {
        apiResponse.json().then((tokenData) => {
          // Generate relative timestamps
          const timeAgo = new TimeAgo('en-US')
          tokenData.forEach((element) => {
            element.created_date_pretty = timeAgo.format(new Date(element.created_date))
            element.expiration_date_pretty = timeAgo.format(new Date(element.expiration_date))
          })

          // Create consistent sort
          tokenData.sort(
            (a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
          )

          this.tokens = tokenData
        })
      })
    },
    saveToken() {
      const urlParams = new URLSearchParams()
      if (this.create_token_label) {
        urlParams.append('label', this.create_token_label)
      }
      urlParams.append('expiry', this.create_token_expiry || '72h')

      const authStore = useAuthStore()
      const auth = new Auth({
        accessToken: authStore.accessToken,
        publicLinkToken: authStore.publicLinkToken,
        publicLinkPassword: authStore.publicLinkPassword
      })

      fetch(`/auth-app/tokens?${urlParams}`, {
        method: 'POST',
        headers: auth.getHeaders()
      })
        .then((apiResponse) => {
          if (apiResponse.ok) {
            apiResponse
              .json()
              .then((tokenData) => {
                this.createdToken = tokenData
                this.create_token_error = null
                this.showCreatedModal = true
                this.getTokens()
              })
              .catch((error) => {
                this.showNotification('Unexpected response from Auth App Service', 'danger')
                console.error(error)
              })
          } else {
            apiResponse.text().then((errorMessage) => (this.create_token_error = errorMessage))
          }
        })
        .catch((error) => {
          this.showNotification('Error connecting to Auth App Service', 'danger')
          console.error(error)
        })
    },
    copyNewToken() {
      navigator.clipboard.writeText(this.createdToken.token)
      this.showNotification('Token copied to clipboard', 'success')
    },
    deleteToken(rowData) {
      this.tokenToDelete = rowData.item.token
      this.showDeleteModal = true
    },
    confirmDelete() {
      const urlParams = new URLSearchParams()
      urlParams.append('token', this.tokenToDelete)

      const authStore = useAuthStore()
      const auth = new Auth({
        accessToken: authStore.accessToken,
        publicLinkToken: authStore.publicLinkToken,
        publicLinkPassword: authStore.publicLinkPassword
      })

      fetch(`/auth-app/tokens?${urlParams}`, {
        method: 'DELETE',
        headers: auth.getHeaders()
      })
        .then(() => {
          this.showNotification('Token deleted', 'success')
        })
        .catch((error) => {
          this.showNotification('Error while deleting token', 'warning')
          console.log(error)
        })
        .finally(() => {
          this.getTokens()
          this.closeDialog()
        })
    },
    closeDialog() {
      this.showCreatedModal = false
      this.showDeleteModal = false
    },
    showNotification(title, status = 'passive') {
      this.notifications.push({
        title: title,
        status: status
      })
    },
    removeNotification(item) {
      this.notifications = this.notifications.filter((el) => el !== item)
    }
  }
}
</script>

<style lang="scss">
main {
  overflow-y: auto;

  .tokens-page {
    width: 80rem;

    h1 {
      border-bottom: 1px solid var(--oc-color-border);
    }
  }
}
@media (max-width: 1200px) {
  main .tokens-page {
    width: 100%;
    padding-left: var(--oc-space-medium);
    padding-right: var(--oc-space-medium);
  }
}
</style>
