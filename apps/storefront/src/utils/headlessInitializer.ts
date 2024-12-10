import { getAPIBaseURL } from '../shared/service/request/base';
import { Environment } from '../types';

const BUYER_PORTAL_INJECTED_SCRIPT_CLASS = `buyer-portal-scripts-headless`;

export async function initHeadlessScripts() {
  const parseAndInsertStorefrontScripts = (storefrontScripts: string) => {
    const b2bScriptDocument = new DOMParser().parseFromString(storefrontScripts, 'text/html');
    const b2bScriptNodes = b2bScriptDocument.querySelectorAll('script');

    if (b2bScriptNodes.length > 0) {
      const existingBuyerPortalScriptNodes = document.querySelectorAll(
        `script.${BUYER_PORTAL_INJECTED_SCRIPT_CLASS}`,
      );
      if (existingBuyerPortalScriptNodes.length > 0) {
        existingBuyerPortalScriptNodes.forEach((oldNode) => {
          oldNode.parentNode?.removeChild(oldNode);
        });
      }

      b2bScriptNodes.forEach((scriptNode) => {
        const newScriptElement = document.importNode(scriptNode, true);
        newScriptElement.className = BUYER_PORTAL_INJECTED_SCRIPT_CLASS;

        document.body.appendChild(newScriptElement);
      });
    }
  };

  async function getScriptContent(originUrl: string): Promise<string> {
    // cSpell:ignore storehash, channelid
    const headlessScriptNode: HTMLElement | null = document.querySelector(
      'script[data-storehash][data-channelid]',
    );
    const params: {
      siteUrl: string;
      storeHash: string;
      channelId: string;
      environment?: Environment;
    } = {
      siteUrl: originUrl,
      storeHash: headlessScriptNode?.dataset?.storehash ?? '',
      channelId: headlessScriptNode?.dataset?.channelid ?? '',
      environment: headlessScriptNode?.dataset?.environment as Environment,
    };
    const response = await fetch(`${getAPIBaseURL(params.environment)}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          {
            storefrontScript(
              storeHash: "${params.storeHash}"
              channelId: ${params.channelId}
              siteUrl: "${params.siteUrl}"
            ) {
              script
              storeHash
              channelId
            }
          }`,
      }),
    });

    if (!response.ok) {
      throw new Error('network error');
    }

    const {
      data: { storefrontScript },
    } = await response.json();
    return storefrontScript.script;
  }

  const scriptContent = await getScriptContent(window.location.origin);
  parseAndInsertStorefrontScripts(scriptContent);
}
