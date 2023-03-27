import { ContentCodec, ContentTypeId, EncodedContent, ContentTypeText } from "@xmtp/xmtp-js"
import { CodecRegistry } from "@xmtp/xmtp-js/dist/types/src/MessageContent"
import { content as proto } from '@xmtp/proto'

export const ContentTypeReply = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'reply',
  versionMajor: 1,
  versionMinor: 0
})

export class Reply {
  inReplyToID: string
  encodedContent: EncodedContent

  private static allowedTypes: ContentTypeId[] = [ContentTypeText]

  static allow(contentType: ContentTypeId) {
    this.allowedTypes.push(contentType)
  }

  static isAllowed(contentType: ContentTypeId): boolean {
    return this.allowedTypes.includes(contentType)
  }

  constructor(inReplyToID: string, encodedContent: EncodedContent) {
    this.inReplyToID = inReplyToID
    this.encodedContent = encodedContent
  }

  decodedContent(registry: CodecRegistry): any {
    const codec = registry.codecFor(this.encodedContent.type)
    return codec?.decode(this.encodedContent, registry)
  }
}

export class ReplyCodec implements ContentCodec<Reply> {
  get contentType(): ContentTypeId {
    return ContentTypeReply
  }

  encode(reply: Reply): EncodedContent {
    if (!Reply.isAllowed(reply.encodedContent.type)) {
      throw new Error('Reply content type not allowed')
    }

    const encodedContent = proto.EncodedContent.encode(reply.encodedContent).finish()

    return {
      type: ContentTypeReply,
      parameters: {
        inReplyToID: reply.inReplyToID,
      },
      content: encodedContent
    }
  }

  decode(content: EncodedContent): Reply {
    const encodedContent = proto.EncodedContent.decode(content.content) as EncodedContent | undefined

    if (!encodedContent) {
      throw new Error('could not decode content')
    }

    return new Reply(content.parameters.inReplyToID, encodedContent)
  }
}
