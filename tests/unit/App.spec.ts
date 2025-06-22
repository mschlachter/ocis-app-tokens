import { expect, test } from 'vitest'

import viewComponent from '../../src/App.vue'
import { defaultPlugins, mount } from '@ownclouders/web-test-helpers'
import { mock } from 'vitest-mock-extended'
import { Resource } from '@ownclouders/web-client'
import { AppConfigObject } from '@ownclouders/web-pkg'

describe('OCIS App Tokens', () => {
  it('does unit conversions correctly', async () => {
    const wrapper = await createWrapperAndFetchData()

    const test_cases = [
      // Standard conversion
      [1, "Minutes", "1m"],
      [1, "Hours", "1h"],
      [1, "Days", "24h"],
      [1, "Weeks", "168h"],
      [1, "Months", "720h"],
      [1, "Years", "8760h"],

      // 0 case (normally would error)
      [0, "Minutes", "0m"],
      [0, "Hours", "0h"],
      [0, "Days", "0h"],
      [0, "Weeks", "0h"],
      [0, "Months", "0h"],
      [0, "Years", "0h"],

      // Double base
      [2, "Minutes", "2m"],
      [2, "Hours", "2h"],
      [2, "Days", "48h"],
      [2, "Weeks", "336h"],
      [2, "Months", "1440h"],
      [2, "Years", "17520h"],

      // X10
      [10, "Minutes", "10m"],
      [10, "Hours", "10h"],
      [10, "Days", "240h"],
      [10, "Weeks", "1680h"],
      [10, "Months", "7200h"],
      [10, "Years", "87600h"],
    ]

    for (let test_data in test_cases.values) {
      expect(wrapper.vm.createExpiryString(test_data[0], test_data[1])).toEqual(test_data[2])
    }
  })

  it('loads WebDAV endpoints', async () => {
    const wrapper = await createWrapperAndFetchData()
    expect(wrapper.find('.endpoint-table').find('tbody').element.childElementCount).equal(2)
  })

  it('loads existing tokens', async () => {
    const wrapper = await createWrapperAndFetchData()
    expect(wrapper.find('.token-table').find('tbody').element.childElementCount).equal(1)
  })

  it('can add a token', async () => {
    // TODO: create this test
    const wrapper = await createWrapperAndFetchData()
    expect(true).toBeTruthy()
  })

  it('can delete a token', async () => {
    // TODO: create this test
    const wrapper = await createWrapperAndFetchData()
    expect(true).toBeTruthy()
  })
})

async function createWrapperAndFetchData() {
    setupMockFetch()
    
    const { wrapper } = createWrapper()

    // Need to await both fetch requests
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Return the wrapper
    return wrapper
}

function createWrapper() {
  return {
    wrapper: mount(viewComponent, {
      props: {
        resource: mock<Resource>(),
        applicationConfig: mock<AppConfigObject>()
      },
      global: {
        plugins: [...defaultPlugins({ piniaOptions: { themeState: { currentTheme: { isDark: false } } } })]
      }
    })
  }
}

function setupMockFetch() {
  // Setup mock fetch
  // Order matches order in viewComponent::created()
  global.fetch = vi.fn()
  // Tokens
  .mockResolvedValueOnce({
    ok: true,
    json: () => {
      return Promise.resolve(
        [
          {
            "token": "$2a$11$LUfq3OCXw73aUZ2iMb11g.dU7oTNF4fXYIldy233oec1u2KnBzoS.",
            "expiration_date": "2025-06-24T22:27:22.811139664Z",
            "created_date": "2025-06-21T22:27:22Z",
            "label": "Generated via API"
          }
        ]
      );
    },
  })
  // Endpoints
  .mockResolvedValueOnce({
    ok: true,
    json: () => {
      return Promise.resolve(
        {
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
        }
      );
    },
  });
}