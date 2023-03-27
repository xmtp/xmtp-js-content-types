import type { Reaction } from '../src/Reaction';
import { test, expect } from '@jest/globals';
import { ContentTypeReaction, ReactionCodec } from '../src/Reaction'
import { Wallet } from 'ethers'
import { Client, PrivateKey } from '@xmtp/xmtp-js'

test('content type exists', () => {
  expect(ContentTypeReaction.authorityId).toBe('xmtp.org')
  expect(ContentTypeReaction.typeId).toBe('reaction')
  expect(ContentTypeReaction.versionMajor).toBe(1)
  expect(ContentTypeReaction.versionMinor).toBe(0)
})

test('can send an Reaction', async () => {
  const aliceWallet = Wallet.createRandom()
  const aliceClient = await Client.create(aliceWallet, { env: 'local' })
  aliceClient.registerCodec(new ReactionCodec())
  await aliceClient.publishUserContact()

  const bobWallet = Wallet.createRandom()
  const bobClient = await Client.create(bobWallet, { env: 'local' })
  bobClient.registerCodec(new ReactionCodec())
  await bobClient.publishUserContact()

  const conversation = await aliceClient.conversations.newConversation(bobWallet.address)
  const originalMessage = await conversation.send('wow this is great')

  const reaction: Reaction = {
    reactingToID: originalMessage.id,
    emoji: '🫡'
  }

  await conversation.send(reaction, { contentType: ContentTypeReaction })

  const bobConversation = await bobClient.conversations.newConversation(aliceWallet.address)
  const messages = await bobConversation.messages()

  expect(messages.length).toBe(2)

  const message = messages[1]
  expect(message.content.reactingToID).toBe(originalMessage.id)
  expect(message.content.emoji).toBe('🫡')
})

test('fails when Reaction is not emoji', async () => {
  const aliceWallet = Wallet.createRandom()
  const aliceClient = await Client.create(aliceWallet, { env: 'local' })
  aliceClient.registerCodec(new ReactionCodec())
  await aliceClient.publishUserContact()

  const bobWallet = Wallet.createRandom()
  const bobClient = await Client.create(bobWallet, { env: 'local' })
  bobClient.registerCodec(new ReactionCodec())
  await bobClient.publishUserContact()

  const conversation = await aliceClient.conversations.newConversation(bobWallet.address)
  const originalMessage = await conversation.send('flowers 123')

  const reaction: Reaction = {
    reactingToID: originalMessage.id,
    emoji: 'this isnt right at all'
  }

  expect(
    conversation.send(reaction, { contentType: ContentTypeReaction })
  ).rejects.toThrow('emoji is not valid')
})
