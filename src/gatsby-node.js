const fetch = require('node-fetch')
exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions
  const { apis } = configOptions

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins

  const sources = []
  const dummyData = {
    id: 'dummy',
    appointment: '',
    bio: '',
    building: '',
    consult_service: '',
    experience: '',
    grant_contract: '',
    honor_award: '',
    innovate_enterpreneur: '',
    patent_invention: '',
    pf_email: '',
    pf_work_fax: '',
    pf_first_name: '',
    pf_last_name: '',
    pf_work_phone: '',
    pf_title: '',
    pf_username: '',
    website: '',
    research: '',
    room: '',
    photo_base64: '',
    notable_courses: '',
    school: '',
    ses_department: '',
    service_university: [
      {
        org: '',
        member_type: '',
      },
    ],
    service_professional: [
      {
        title: '',
        org: '',
      },
    ],
    education: [
      {
        dty_comp: '',
        deg: '',
        degother: '',
        school: '',
        state: '',
        country: '',
        major: '',
      },
    ],
    member: [
      {
        org: '',
        status: '',
        orgabbr: ''
      },
    ],
    intellcont: [
      {
        contype: '',
        contypeother: '',
        pagenum: '',
        status: '',
        title: '',
        title_secondary: '',
        volume: '',
        publisher: '',
        pubctyst: '',
        issue: '',
        dty_pub: '',
        dty_acc: '',
        dty_sub: '',
        web_address: '',
        intellcont_auth: [ 
          {
            mname: '',
            fname: '',
            lname: '',
          },
        ],
      },
    ],
  }
  
  const dummyNodeContent = JSON.stringify(dummyData)
  
  const dummyNodeMeta = {
    id: createNodeId(`PeopleFaculty-dummy`),
    endpointId: "dummy",
    parent: null,
    children: [],
    internal: {
      type: `MultiApiSourcePeopleFaculty`,
      content: dummyNodeContent,
      contentDigest: createContentDigest(dummyData),
    },
  }
  
  const dummyNode = Object.assign({}, dummyData, dummyNodeMeta)
  createNode(dummyNode)
  // Helper function that processes a result to match Gatsby's node structure
  const processResult = ({ result, endpoint, prefix }) => {
    const nodeId = createNodeId(`${endpoint}-${result.pf_username}`)
    const nodeContent = JSON.stringify(result)
    const meta = {
      id: nodeId,
      endpointId: result.pf_username,
      parent: null,
      children: [],
      internal: {
        type: `${prefix}${customFormat(endpoint)}`,
        content: nodeContent,
        contentDigest: createContentDigest(result),
      },
    }
    const nodeData = Object.assign({}, result, meta)
    return nodeData
  }

  const appendSources = ({ url, endpoint, prefix, method }) => {
    sources.push(
      fetchData(url, { method })
        .then(data => {
          if (Array.isArray(data)) {
            /* if fetchData returns multiple results */
            data.forEach(result => {
              const nodeData = processResult({
                result,
                endpoint,
                prefix,
              })
              createNode(nodeData)
            })
          } else {
            // Otherwise a single result has been returned
            const nodeData = processResult({
              result: data,
              endpoint,
              prefix,
            })
            createNode(nodeData)
          }
        })
        .catch(error => console.log(error))
    )
  }

  apis.forEach(api => {
    /* check if the api request is an object with parameters */
    if (typeof api === 'object') {
      const { prefix, baseUrl, endpoints, method = 'GET' } = api

      /* Add some error logging if required config options are mising */
      if (!baseUrl) {
        console.log('\x1b[31m')
        console.error(
          'error gatsby-source-rest-api option requires the baseUrl parameter'
        )
        console.log('')
        return
      }

      /* object is used and endpoints are set */
      if (endpoints && endpoints.length) {
        endpoints.forEach(endpoint => {
          appendSources({
            url:
              baseUrl[baseUrl.length - 1] === '/'
                ? `${baseUrl}${endpoint}`
                : `${baseUrl}/${endpoint}`,
            endpoint,
            prefix,
            method,
          })
        })
        return
      }

      /* object is used but no endpoints are set */
      appendSources({
        url: baseUrl,
        endpoint: baseUrl,
        prefix,
        method,
      })
      return
    }

    /* The default simply expects a api url as a string and no other options */
    if (typeof api === 'string') {
      if (api.length) {
        appendSources({
          url: api,
          endpoint: api,
          prefix: 'MultiApiSource',
          method: 'GET',
        })
      }
    }
  })
  
  return Promise.all(sources)
}

// Helper function to fetch data
const fetchData = async (url, options = {}) => {
  const response = await fetch(`${url}`, options)
  return await response.json()
}

//strips special characters and makes string camelcase
const customFormat = str => {
  return str
    .replace(/^.*\/\/[^\/]+/, '') //Removes domain
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()) //Capitalizes strings
    .replace(/\//g, '') //Removes slashes
    .replace(/\-+/g, '') //Removes hyphens
    .replace(/\s+/g, '') //Removes spaces
}
