import { test, expect } from '@jest/globals';
import { ContentTypeReply, ReplyCodec, Reply } from '../src/Reply'
import { Wallet } from 'ethers'
import { Client, TextCodec } from '@xmtp/xmtp-js'

test('content type exists', () => {
  expect(ContentTypeReply.authorityId).toBe('xmtp.org')
  expect(ContentTypeReply.typeId).toBe('reply')
  expect(ContentTypeReply.versionMajor).toBe(1)
  expect(ContentTypeReply.versionMinor).toBe(0)
})

test('can send an Reply', async () => {
  const aliceWallet = Wallet.createRandom()
  const aliceClient = await Client.create(aliceWallet, { env: 'local' })
  aliceClient.registerCodec(new ReplyCodec())
  await aliceClient.publishUserContact()

  const bobWallet = Wallet.createRandom()
  const bobClient = await Client.create(bobWallet, { env: 'local' })
  bobClient.registerCodec(new ReplyCodec())
  await bobClient.publishUserContact()

  const conversation = await aliceClient.conversations.newConversation(bobWallet.address)
  const originalMessage = await conversation.send('wow this is great')

  const reply = new Reply(originalMessage.id, new TextCodec().encode("not bad"))

  await conversation.send(reply, { contentType: ContentTypeReply })

  const bobConversation = await bobClient.conversations.newConversation(aliceWallet.address)
  const messages = await bobConversation.messages()

  expect(messages.length).toBe(2)

  const message = messages[1]
  expect(message.content.inReplyToID).toBe(originalMessage.id)
  expect(message.content.decodedContent(aliceClient)).toBe("not bad")
})

test('fails when Reply encodedContent is not allowed', async () => {
  const aliceWallet = Wallet.createRandom()
  const aliceClient = await Client.create(aliceWallet, { env: 'local' })
  aliceClient.registerCodec(new ReplyCodec())
  await aliceClient.publishUserContact()

  const bobWallet = Wallet.createRandom()
  const bobClient = await Client.create(bobWallet, { env: 'local' })
  bobClient.registerCodec(new ReplyCodec())
  await bobClient.publishUserContact()

  const conversation = await aliceClient.conversations.newConversation(bobWallet.address)
  const originalMessage = await conversation.send('flowers 123')

  const reply = new Reply(originalMessage.id, new TextCodec().encode("not bad"))
  const replyReply = new Reply(originalMessage.id, new ReplyCodec().encode(reply))

  expect(
    conversation.send(replyReply, { contentType: ContentTypeReply })
  ).rejects.toThrow('Reply content type not allowed')
})
