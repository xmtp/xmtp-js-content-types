import type { Attachment } from '../../remote-attachment/src/Attachment';
import { test, expect } from '@jest/globals';
import { ContentTypeAttachment, AttachmentCodec } from '../../remote-attachment/src/Attachment'
import { Wallet } from 'ethers'
import { Client, PrivateKey } from '@xmtp/xmtp-js'

test('content type exists', () => {
  expect(ContentTypeAttachment.authorityId).toBe('xmtp.org')
  expect(ContentTypeAttachment.typeId).toBe('attachment')
  expect(ContentTypeAttachment.versionMajor).toBe(1)
  expect(ContentTypeAttachment.versionMinor).toBe(0)
})

test('can send an attachment', async () => {
  const aliceWallet = Wallet.createRandom()
  const aliceClient = await Client.create(aliceWallet, { env: 'local' })
  aliceClient.registerCodec(new AttachmentCodec())
  await aliceClient.publishUserContact()

  const bobWallet = Wallet.createRandom()
  const bobClient = await Client.create(bobWallet, { env: 'local' })
  bobClient.registerCodec(new AttachmentCodec())
  await bobClient.publishUserContact()

  const conversation = await aliceClient.conversations.newConversation(bobWallet.address)

  const attachment: Attachment = {
    filename: 'test.png',
    mimeType: 'image/png',
    data: Uint8Array.from([5, 4, 3, 2, 1])
  }

  await conversation.send(attachment, { contentType: ContentTypeAttachment })

  const bobConversation = await bobClient.conversations.newConversation(aliceWallet.address)
  const messages = await bobConversation.messages()

  expect(messages.length).toBe(1)

  const message = messages[0]
  expect(message.content.filename).toBe('test.png')
  expect(message.content.mimeType).toBe('image/png')
  expect(message.content.data).toStrictEqual(Uint8Array.from([5, 4, 3, 2, 1]))
})
