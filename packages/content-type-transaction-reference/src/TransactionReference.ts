import { ContentTypeId } from "@xmtp/xmtp-js";
import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";

export const ContentTypeTransactionReference = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "transactionReference",
  versionMajor: 2,
  versionMinor: 0,
});

export type TransactionReference = {
  /**
   * The chain ID for the transaction as outlined in EIP-155
   */
  chainId: number;
  /**
   * The networkId for the transaction
   */
  networkId?: number;
  /**
   * The transaction hash
   */
  reference: string;
  /**
   * Optional metadata object
   */
  metadata?: {
    transactionType: string;
    currency: string;
    amount: bigint;
    decimals: number;
    fromAddress: string;
    toAddress: string;
  };
};

export class TransactionReferenceCodec
  implements ContentCodec<TransactionReference>
{
  get contentType(): ContentTypeId {
    return ContentTypeTransactionReference;
  }

  encode(content: TransactionReference): EncodedContent {
    const encoded = {
      type: ContentTypeTransactionReference,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
    return encoded;
  }

  decode(encodedContent: EncodedContent): TransactionReference {
    const uint8Array = encodedContent.content;
    const contentReceived = JSON.parse(
      new TextDecoder().decode(uint8Array),
    ) as TransactionReference;
    return contentReceived;
  }

  fallback(content: TransactionReference): string | undefined {
    if (content.reference) {
      return `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: ${content.reference}`;
    }
    return `Crypto transaction`;
  }

  shouldPush() {
    return true;
  }
}
