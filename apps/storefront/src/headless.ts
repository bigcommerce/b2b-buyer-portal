import { getAPIBaseURL } from './shared/service/request/base';
import b2bLogger from './utils/b3Logger';
import { Environment } from './types';

// cSpell:ignore storehash, channelid
interface ScriptNodeChildren extends HTMLScriptElement {
  dataSrc?: string;
  crossorigin?: string | boolean;
}

const BUYER_PORTAL_INJECTED_SCRIPT_CLASS = `buyer-portal-scripts-headless`;

async function init() {
  const parseAndInsertStorefrontScripts = (storefrontScripts: string) => {
    const b2bScriptDocument = new DOMParser().parseFromString(storefrontScripts, 'text/html');
    const b2bScriptNodes = b2bScriptDocument.querySelectorAll('script');

    if (b2bScriptNodes.length > 0) {
      const body: HTMLBodyElement | null = document.querySelector('body');

      const existingBuyerPortalScriptNodes = document.querySelectorAll(
        `script.${BUYER_PORTAL_INJECTED_SCRIPT_CLASS}`,
      );
      if (existingBuyerPortalScriptNodes.length > 0) {
        existingBuyerPortalScriptNodes.forEach((oldNode) => {
          oldNode.parentNode?.removeChild(oldNode);
        });
      }

      b2bScriptNodes.forEach((scriptNode: ScriptNodeChildren) => {
        const newScriptElement = document.createElement('script');
        newScriptElement.outerHTML = scriptNode.outerHTML;
        newScriptElement.className = BUYER_PORTAL_INJECTED_SCRIPT_CLASS;

        if (body) {
          body.appendChild(newScriptElement);
        }
      });
    }
  };

  async function getScriptContent(originUrl: string): Promise<string> {
    const headlessScriptNode: HTMLElement | null = document.querySelector(
      'script[data-storehash][data-channelid]',
    );
    const params: {
      siteUrl: string;
      storeHash: string;
      channelId: string;
      environment: Environment;
    } = {
      siteUrl: originUrl,
      storeHash: headlessScriptNode?.dataset?.storehash ?? '',
      channelId: headlessScriptNode?.dataset?.channelid ?? '',
      environment:
        (headlessScriptNode?.dataset?.environment as Environment) ?? Environment.Production,
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

init().catch((error) => {
  b2bLogger.error('headless buyer portal initialization failed', error);
});

export {};
