<template>
  <!-- documentation for components: https://owncloud.design/#/oC%20Components -->
  <main class="oc-mt-m oc-mb-l oc-flex oc-flex-center app-content oc-width-1-1">
    <div class="tokens-page">
      <h1 class="oc-heading-divider">App Tokens</h1>
      <p>
        Please ensure the
        <a
          href="https://doc.owncloud.com/ocis/next/deployment/services/s-list/auth-app.html"
          target="_blank"
          >Auth App Service</a
        >
        is enabled and configured before using this plugin.
      </p>
      <h2 class="oc-heading-divider">Create Token</h2>
      <form id="create-token-form" @submit.prevent="saveToken()">
        <!-- Custom labels only supported on OCIS > 7.2.0 -->
        <oc-text-input
          v-model="create_token_label"
          label="Label (Optional)"
          :class="'token-label oc-mb' + (enableCustomLabels ? '' : ' oc-hidden')"
        />
        <oc-grid gutter="small" class="oc-mb oc-flex oc-flex-top">
          <oc-text-input
            v-model="create_token_expiry"
            label="Expires in"
            type="number"
            :error-message="create_token_error"
            style="width: 5em"
            class="expires-input"
          />
          <oc-select
            v-model="create_token_expiry_units"
            label="Units"
            :options="Object.keys(expiryStringGenerator)"
            :clearable="false"
            :searchable="false"
            style="width: 8em"
            class="expires-unit-dropdown"
          />
        </oc-grid>
        <oc-button variation="primary" class="oc-mb save-token-btn" submit="submit"> Create </oc-button>
      </form>
      <h2 class="oc-heading-divider">Existing Tokens</h2>
      <oc-table :fields="tokenTableFields" :data="tokens" :sticky="true" :hover="true" idKey="token" class="token-table">
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
          <oc-button size="small" variant="danger" class="delete-btn" @click="deleteToken(rowData)">Delete</oc-button>
        </template>
      </oc-table>
      <h2 class="oc-heading-divider">WebDAV Endpoints</h2>
      <oc-table :fields="endpointTableFields" :data="endpoints" :sticky="true" :hover="true" idKey="driveAlias" class="endpoint-table">
        <template #footer> {{ tokens.length || 0 }} endpoints </template>
        <template #webUrl="rowData">
          <a class="long-link-text" :href="rowData.item.webUrl" target="_blank">{{ rowData.item.webUrl }}</a>
        </template>
        <template #webDavUrl="rowData">
          <a class="long-link-text" :href="rowData.item.root.webDavUrl" target="_blank">{{
            rowData.item.root.webDavUrl
          }}</a>
        </template>
        <template #action="rowData">
          <oc-button class="oc-text-nowrap" size="small" variant="danger" @click="copyEndpointUrl(rowData)">
            Copy WebDAV URL
          </oc-button>
        </template>
      </oc-table>
    </div>
  </main>
  <oc-modal
    v-if="showCreatedModal"
    class="created-modal"
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
    class="delete-confirm-modal"
    variation="danger"
    icon="alert"
    title="Delete token"
    :message="`Are you sure you want to delete this token (${tokenToDelete?.label})? All applications using this token will lose access.`"
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
  props: {
    enableCustomLabels: { type: Boolean, required: false, default: true },
  },
  data() {
    return {
      tokens: [],
      tokenTableFields: [
        {
          name: 'label',
          title: 'Label',
          alignH: 'left',
          thClass: 'th-label',
          tdClass: 'td-label'
        },
        {
          name: 'created_date',
          title: 'Created',
          alignH: 'left',
          type: 'slot',
          thClass: 'th-created-date',
          tdClass: 'td-created-date'
        },
        {
          name: 'expiration_date',
          title: 'Expires',
          alignH: 'left',
          type: 'slot',
          thClass: 'th-expiration-date',
          tdClass: 'td-expiration-date'
        },
        {
          name: 'token',
          title: 'Encrypted Token',
          alignH: 'left',
          wrap: 'break',
          thClass: 'th-token',
          tdClass: 'td-token'
        },
        {
          name: 'action',
          title: '',
          type: 'slot',
          width: 'shrink',
          thClass: 'th-action',
          tdClass: 'td-action'
        }
      ],
      endpoints: [],
      endpointTableFields: [
        {
          name: 'name',
          title: 'Drive Name',
          alignH: 'left',
          thClass: 'th-drive-name',
          tdClass: 'td-drive-name'
        },
        {
          name: 'driveAlias',
          title: 'Drive Path',
          alignH: 'left',
          thClass: 'th-drive-alias',
          tdClass: 'td-drive-alias'
        },
        {
          name: 'driveType',
          title: 'Type',
          alignH: 'left',
          thClass: 'th-drive-type',
          tdClass: 'td-drive-type'
        },
        {
          name: 'webUrl',
          title: 'Web URL',
          alignH: 'left',
          type: 'slot',
          thClass: 'th-web-url',
          tdClass: 'td-web-url'
        },
        {
          name: 'webDavUrl',
          title: 'WebDAV URL',
          alignH: 'left',
          type: 'slot',
          thClass: 'th-webdav-url',
          tdClass: 'td-webdav-url'
        },
        {
          name: 'action',
          title: '',
          type: 'slot',
          width: 'shrink',
          thClass: 'th-action',
          tdClass: 'td-action'
        }
      ],
      create_token_label: null,
      create_token_expiry: 72,
      create_token_expiry_units: 'Hours',
      create_token_error: null,
      showCreatedModal: false,
      createdToken: null,
      showDeleteModal: false,
      tokenToDelete: null,
      notifications: [],
      expiryStringGenerator: {
        Minutes: (amount: number) => amount + 'm',
        Hours: (amount: number) => amount + 'h',
        Days: (amount: number) => amount * 24 + 'h',
        Weeks: (amount: number) => amount * 24 * 7 + 'h',
        Months: (amount: number) => amount * 24 * 30 + 'h',
        Years: (amount: number) => amount * 24 * 365 + 'h'
      }
    }
  },
  created: function () {
    this.getTokens()
    this.getEndpoints()
  },
  methods: {
    getTokens: function () {
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
    getEndpoints: function () {
      const authStore = useAuthStore()
      const auth = new Auth({
        accessToken: authStore.accessToken,
        publicLinkToken: authStore.publicLinkToken,
        publicLinkPassword: authStore.publicLinkPassword
      })

      fetch('/graph/v1.0/me/drives', {
        headers: auth.getHeaders()
      }).then((apiResponse) => {
        apiResponse.json().then((endpointData) => {
          // Create consistent sort
          endpointData.value.sort((a, b) => {
            if (a.driveAlias < b.driveAlias) {
              return -1
            }
            if (a.driveAlias > b.driveAlias) {
              return 1
            }
            return 0
          })

          this.endpoints = endpointData.value
        })
      })
    },
    copyEndpointUrl: function (rowData) {
      navigator.clipboard.writeText(rowData.item.root.webDavUrl)
      this.showNotification('WebDAV URL copied to clipboard', 'success')
    },
    createExpiryString: function (amount, units) {
      return this.expiryStringGenerator[units](amount)
    },
    saveToken: function () {
      // Basic validation
      if (isNaN(this.create_token_expiry) || this.create_token_expiry <= 0) {
        this.create_token_error = "'Expires in' must be a number greater than 0"
        return
      }

      const urlParams = new URLSearchParams()
      if (this.create_token_label) {
        urlParams.append('label', this.create_token_label)
      }
      const expiryString = this.createExpiryString(
        this.create_token_expiry,
        this.create_token_expiry_units
      )
      urlParams.append('expiry', expiryString)

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
                this.openCreatedModal()
                this.create_token_label = null
              })
              .catch((error) => {
                this.showNotification('Unexpected response from Token Service', 'danger')
                console.error(error)
              })
              .finally(() => {
                this.getTokens()
              })
          } else {
            apiResponse.text().then((errorMessage) => (this.create_token_error = errorMessage))
          }
        })
        .catch((error) => {
          this.showNotification('Error connecting to Token Service', 'danger')
          console.error(error)
        })
    },
    copyNewToken: function () {
      navigator.clipboard.writeText(this.createdToken.token)
      this.showNotification('Token copied to clipboard', 'success')
    },
    deleteToken: function (rowData) {
      this.tokenToDelete = rowData.item
      this.openDeletedModal()
    },
    confirmDelete: function () {
      const urlParams = new URLSearchParams()
      urlParams.append('token', this.tokenToDelete.token)

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
    openCreatedModal: function() {
      this.showCreatedModal = true
    },
    openDeletedModal: function() {
      this.showDeleteModal = true
    },
    closeDialog: function () {
      this.showCreatedModal = false
      this.showDeleteModal = false
    },
    showNotification: function (title, status = 'passive') {
      this.notifications.push({
        title: title,
        status: status
      })
    },
    removeNotification: function (item) {
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

    .long-link-text {
      display: inline-block;
      max-width: min(20vw, 20rem);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }
}
@media (max-width: 800px) {
    .th-webdav-url, .td-webdav-url {
      display: none;
    }
}
@media (max-width: 1200px) {
  main .tokens-page {
    width: calc(100vw - (var(--oc-space-medium) * 2));
    padding-left: var(--oc-space-medium);
    padding-right: var(--oc-space-medium);

    .th-created-date, .td-created-date,
    .th-drive-type, .td-drive-type,
    .th-drive-alias, .td-drive-alias {
      display: none;
    }
  }
}
</style>
