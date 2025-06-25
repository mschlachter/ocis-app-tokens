import { vi, expect, Mock } from 'vitest'

import App from '../../src/App.vue'
import { defaultPlugins, flushPromises, mount } from '@ownclouders/web-test-helpers'
import { mock } from 'vitest-mock-extended'
import { Resource } from '@ownclouders/web-client'
import { AppConfigObject } from '@ownclouders/web-pkg'

const MOCKED_RESPONSES = {
  token_get: {
    ok: true,
    json: () => {
      return Promise.resolve([
        {
          "token": "$2a$11$LUfq3OCXw73aUZ2iMb11g.dU7oTNF4fXYIldy233oec1u2KnBzoS.",
          "expiration_date": "2025-06-24T22:27:22.811139664Z",
          "created_date": "2025-06-21T22:27:22Z",
          "label": "Generated via API"
        }
      ])
    }
  },
  token_get_post_save: {
    ok: true,
    json: () => {
      return Promise.resolve([
        {
          "token": "$2a$11$LUfq3OCXw73aUZ2iMb11g.dU7oTNF4fXYIldy233oec1u2KnBzoS.",
          "expiration_date": "2025-06-24T22:27:22.811139664Z",
          "created_date": "2025-06-21T22:27:22Z",
          "label": "Generated via API"
        },
        {
          "token": "$2a$11$LUfq3OCXw73aUZ2iMb11g.dU7oTNF4fXYIldy233oec1u2KnBzoS.",
          "expiration_date": "2025-06-24T22:27:22.811139664Z",
          "created_date": "2025-06-21T22:27:22Z",
          "label": "Generated via API"
        }
      ])
    }
  },
  token_get_post_delete: {
    ok: true,
    json: () => {
      return Promise.resolve([])
    }
  },
  token_post: {
    ok: true,
    json: () => {
      return Promise.resolve({
        "token": "5B1oI2H48DMn630s",
        "expiration_date": "2025-06-25T01:53:25.312230089Z",
        "created_date": "2025-06-22T01:53:25Z",
        "label": "Generated via API"
      })
    }
  },
  token_delete: {
    ok: true,
  },
  endpoints_get: {
    ok: true,
    json: () => {
      return Promise.resolve({
        "value": [
          {
            "driveAlias": "virtual/shares",
            "driveType": "virtual",
            "id": "a0ca6a90-a365-4782-871e-d44447bbc668$a0ca6a90-a365-4782-871e-d44447bbc668",
            "name": "Shares",
            "root": {
              "eTag": "DECAFC00FEE",
              "id": "a0ca6a90-a365-4782-871e-d44447bbc668$a0ca6a90-a365-4782-871e-d44447bbc668",
              "webDavUrl": "https://host.docker.internal:9200/dav/spaces/a0ca6a90-a365-4782-871e-d44447bbc668$a0ca6a90-a365-4782-871e-d44447bbc668"
            },
            "webUrl": "https://host.docker.internal:9200/f/a0ca6a90-a365-4782-871e-d44447bbc668$a0ca6a90-a365-4782-871e-d44447bbc668"
          },
          {
            "driveAlias": "personal/admin",
            "driveType": "personal",
            "id": "bba7fa09-4da5-404b-859b-d13fe25ea8ee$8abba08e-bf96-40a3-ba2d-cfcf789c9eb6",
            "lastModifiedDateTime": "2025-06-21T21:35:17.367681765Z",
            "name": "Admin",
            "owner": {
              "user": {
                "displayName": "",
                "id": "8abba08e-bf96-40a3-ba2d-cfcf789c9eb6"
              }
            },
            "quota": {
              "remaining": {
                "source": "9223372036854775807",
                "parsedValue": 9223372036854776000
              },
              "state": "normal",
              "total": 0,
              "used": 0
            },
            "root": {
              "eTag": "\"9e279fba6c69e5cc3a1d540c6ac281eb\"",
              "id": "bba7fa09-4da5-404b-859b-d13fe25ea8ee$8abba08e-bf96-40a3-ba2d-cfcf789c9eb6",
              "webDavUrl": "https://host.docker.internal:9200/dav/spaces/bba7fa09-4da5-404b-859b-d13fe25ea8ee$8abba08e-bf96-40a3-ba2d-cfcf789c9eb6"
            },
            "webUrl": "https://host.docker.internal:9200/f/bba7fa09-4da5-404b-859b-d13fe25ea8ee$8abba08e-bf96-40a3-ba2d-cfcf789c9eb6"
          }
        ]
      })
    }
  },
}

describe('OCIS App Tokens', () => {
  afterEach(async () => {
    // Make sure there are no pending requests
    await flushPromises()
  })

  it('does unit conversions correctly', async () => {
    const { wrapper, } = await createWrapperAndFetchData()

    const test_cases = [
      // Standard conversion
      { amount: 1, units: "Minutes", expected_result: "1m" },
      { amount: 1, units: "Hours", expected_result: "1h" },
      { amount: 1, units: "Days", expected_result: "24h" },
      { amount: 1, units: "Weeks", expected_result: "168h" },
      { amount: 1, units: "Months", expected_result: "720h" },
      { amount: 1, units: "Years", expected_result: "8760h" },

      // 0 case (normally would error)
      { amount: 0, units: "Minutes", expected_result: "0m" },
      { amount: 0, units: "Hours", expected_result: "0h" },
      { amount: 0, units: "Days", expected_result: "0h" },
      { amount: 0, units: "Weeks", expected_result: "0h" },
      { amount: 0, units: "Months", expected_result: "0h" },
      { amount: 0, units: "Years", expected_result: "0h" },

      // Double base
      { amount: 2, units: "Minutes", expected_result: "2m" },
      { amount: 2, units: "Hours", expected_result: "2h" },
      { amount: 2, units: "Days", expected_result: "48h" },
      { amount: 2, units: "Weeks", expected_result: "336h" },
      { amount: 2, units: "Months", expected_result: "1440h" },
      { amount: 2, units: "Years", expected_result: "17520h" },

      // X10
      { amount: 10, units: "Minutes", expected_result: "10m" },
      { amount: 10, units: "Hours", expected_result: "10h" },
      { amount: 10, units: "Days", expected_result: "240h" },
      { amount: 10, units: "Weeks", expected_result: "1680h" },
      { amount: 10, units: "Months", expected_result: "7200h" },
      { amount: 10, units: "Years", expected_result: "87600h" },
    ]

    for (const test_data of test_cases) {
      expect(
        wrapper.vm.createExpiryString(test_data.amount, test_data.units)
      ).toEqual(test_data.expected_result)
    }
  })

  it('loads WebDAV endpoints', async () => {
    const { wrapper, } = await createWrapperAndFetchData()
    expect(wrapper.find('.endpoint-table tbody').element.childElementCount).equal(2)
  })

  it('loads existing tokens', async () => {
    const { wrapper, } = await createWrapperAndFetchData()
    expect(wrapper.find('.token-table tbody').element.childElementCount).equal(1)
  })

  it('can add a token', async () => {
    // Set expiry to 3 days, which should be transformed into "72h"
    const { wrapper, mocked_fetch } = await createWrapperAndFetchData(3, "Days");

    mocked_fetch.mockResolvedValueOnce(MOCKED_RESPONSES.token_post)
      .mockResolvedValueOnce(MOCKED_RESPONSES.token_get_post_save);

    // Form submit / submit button click events aren't correctly handled by happy-dom yet..
    // await wrapper.find('#create-token-form .save-token-btn').trigger('click')
    wrapper.vm.saveToken();
    await flushPromises()

    expect(mocked_fetch).toHaveBeenCalledWith(
      "/auth-app/tokens?expiry=72h",
      {
        "headers": {},
        "method": "POST",
      }
    );

    expect(wrapper.vm.createdToken).toEqual(await MOCKED_RESPONSES.token_post.json())

    expect(wrapper.find('.token-table tbody').element.childElementCount).equal(2)
  })

  it('can delete a token', async () => {
    const { wrapper, mocked_fetch } = await createWrapperAndFetchData();

    mocked_fetch.mockResolvedValueOnce(MOCKED_RESPONSES.token_delete)
      .mockResolvedValueOnce(MOCKED_RESPONSES.token_get_post_delete);

    wrapper.vm.deleteToken({
      item: {
        token: '$2a$11$LUfq3OCXw73aUZ2iMb11g.dU7oTNF4fXYIldy233oec1u2KnBzoS.'
      }
    })
    wrapper.vm.confirmDelete()

    await flushPromises()

    expect(mocked_fetch).toHaveBeenCalledWith(
      "/auth-app/tokens?token=%242a%2411%24LUfq3OCXw73aUZ2iMb11g.dU7oTNF4fXYIldy233oec1u2KnBzoS.",
      {
        "headers": {},
        "method": "DELETE",
      }
    );

    expect(wrapper.find('.token-table tbody').element.childElementCount).equal(0)
  })
})

async function createWrapperAndFetchData(expiry: number = 72, expiry_units: string = "Hours") {
  const mocked_fetch = setupMockFetch()

  const wrapper = createWrapper(expiry, expiry_units)
  disableModals(wrapper)

  // Let requests finish and tables load
  await flushPromises()

  // Return the wrapper
  return { wrapper, mocked_fetch }
}

function createWrapper(expiry: number = 72, expiry_units: string = "Hours") {
  return mount(App, {
    props: {
      resource: mock<Resource>(),
      applicationConfig: mock<AppConfigObject>(),
      create_token_expiry: expiry,
      create_token_expiry_units: expiry_units
    },
    global: {
      plugins: [...defaultPlugins({ piniaOptions: { themeState: { currentTheme: { isDark: false } } } })]
    }
  })
}

function setupMockFetch(): Mock {
  // Setup mock fetch
  // Order of requests matches order in App::created()
  const mocked_fetch = vi.fn()
    .mockResolvedValueOnce(MOCKED_RESPONSES.token_get)
    .mockResolvedValueOnce(MOCKED_RESPONSES.endpoints_get);
  globalThis.fetch = mocked_fetch
  return mocked_fetch
}

function disableModals(wrapper) {
  wrapper.vm.openCreatedModal = () => { }
  wrapper.vm.openDeletedModal = () => { }
}