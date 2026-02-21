const JUSTWATCH_API = 'https://apis.justwatch.com/graphql'

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
}

const SEARCH_QUERY = `
  query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
    popularTitles(country: $country, first: $first, filter: $filter) {
      edges {
        node {
          id
          objectType
          content(country: $country, language: $language) {
            title
          }
        }
      }
    }
  }
`

const OFFERS_QUERY = `
  query GetTitleOffers($nodeId: ID!, $country: Country!) {
    node(id: $nodeId) {
      ... on Movie {
        offers(country: $country, platform: WEB) {
          monetizationType
          package {
            clearName
            technicalName
          }
        }
      }
      ... on Show {
        offers(country: $country, platform: WEB) {
          monetizationType
          package {
            clearName
            technicalName
          }
        }
      }
    }
  }
`

const STREAMING_TYPES = new Set(['FLATRATE', 'FREE', 'ADS'])

export async function fetchStreamingAvailability(title: string, country = 'BR'): Promise<string[]> {
  try {
    // Step 1: Search for the title to get node ID
    const searchRes = await fetch(JUSTWATCH_API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        operationName: 'GetSuggestedTitles',
        query: SEARCH_QUERY,
        variables: {
          country,
          language: 'pt',
          first: 3,
          filter: { searchQuery: title },
        },
      }),
    })

    if (!searchRes.ok) return []

    const searchData = await searchRes.json()
    const edges: any[] = searchData?.data?.popularTitles?.edges ?? []
    if (edges.length === 0) return []

    const nodeId: string = edges[0].node.id

    // Step 2: Fetch streaming offers for this node
    const offersRes = await fetch(JUSTWATCH_API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        operationName: 'GetTitleOffers',
        query: OFFERS_QUERY,
        variables: { nodeId, country },
      }),
    })

    if (!offersRes.ok) return []

    const offersData = await offersRes.json()
    const offers: any[] = offersData?.data?.node?.offers ?? []

    // Filter to subscription/free streaming only, deduplicate by technicalName
    const seen = new Set<string>()
    const services: string[] = []
    for (const offer of offers) {
      if (!STREAMING_TYPES.has(offer.monetizationType)) continue
      const key: string = offer.package.technicalName
      if (seen.has(key)) continue
      seen.add(key)
      services.push(offer.package.clearName)
    }

    return services
  } catch {
    return []
  }
}
