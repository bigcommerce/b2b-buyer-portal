const mode: string = import.meta.env.MODE

interface ScriptNodeChildren extends HTMLScriptElement {
  dataSrc?: string
  crossorigin?: string | boolean
}

interface GraphqlOriginProps {
  [key: string]: string
}

const graphqlOrigin: GraphqlOriginProps = {
  development: 'https://staging-v2.bundleb2b.net',
  staging: 'https://staging-v2.bundleb2b.net',
  production: 'https://api.bundleb2b.net',
}

function init() {
  const insertScript = (scriptString: string) => {
    const doc = new DOMParser().parseFromString(scriptString, 'text/html')
    const scriptNodes = doc.querySelectorAll('script')

    if (scriptNodes.length) {
      const body: HTMLBodyElement | null = document.querySelector('body')

      const oldScriptNodes = document.querySelectorAll(
        '.headless-buyerPortal-id'
      )
      if (oldScriptNodes.length > 0) {
        oldScriptNodes.forEach((oldNode) => {
          oldNode.parentNode?.removeChild(oldNode)
        })
      }
      scriptNodes.forEach((node: ScriptNodeChildren, index: number) => {
        const nodeInnerHTML = node?.innerHTML || ''
        const nodeSrc = node?.src || ''
        const dataSrc = node?.dataSrc || ''
        const type = node?.type || ''
        const crossorigin = node?.crossorigin || ''
        const id = node?.id || ''
        const scriptElement = document.createElement('script')
        scriptElement.innerHTML = nodeInnerHTML
        scriptElement.className = 'headless-buyerPortal-id'
        if (nodeSrc) scriptElement.setAttribute('src', nodeSrc)
        if (dataSrc) scriptElement.setAttribute('data-src', dataSrc)
        if (type) {
          scriptElement.setAttribute('type', 'module')
        } else if (index !== 0) {
          scriptElement.noModule = true
        }
        if (id) scriptElement.setAttribute('id', id)

        if (crossorigin) scriptElement.setAttribute('crossorigin', 'true')

        if (body) {
          body.appendChild(scriptElement)
        }
      })
    }
  }

  async function getScriptContent(originUrl: string) {
    const params: {
      siteUrl: string
      storehash: string
      channelId: string | number
    } = {
      siteUrl: originUrl,
      storehash: '',
      channelId: '',
    }
    const scriptNodes = document.querySelectorAll('script')
    if (scriptNodes && scriptNodes.length > 0) {
      scriptNodes.forEach((node) => {
        if (node.src.includes('/headless.js')) {
          if (node.dataset) {
            const data = node.dataset
            params.storehash = data.storehash || ''
            params.channelId = data.channelid || ''
          }
        }
      })
    }
    const data = {
      query: `
        {
          storefrontScript(
            storeHash: "${params.storehash}"
            channelId: ${params.channelId}
            siteUrl: "${params.siteUrl}"
          ) {
            script
            storeHash
            channelId
          }
        }`,
    }
    const init = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data),
    }
    fetch(`${graphqlOrigin[mode]}/graphql`, init)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then((data) => {
        const {
          data: { storefrontScript },
        } = data
        insertScript(storefrontScript.script)
      })
      .catch((error) => {
        console.error('There was a problem with the fetch operation:', error)
      })
  }

  async function analyzeScript() {
    try {
      const { origin } = window.location

      await getScriptContent(origin)
    } catch (error) {
      console.error('Interface error')
    }
  }

  analyzeScript()
}

init()

export {}
