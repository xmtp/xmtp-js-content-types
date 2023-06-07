# XMTP-JS remote content types

This repo provides JavaScript implementations of content types you can use with your app built with the [XMTP client SDK for JavaScript](https://github.com/xmtp/xmtp-js) (`xmtp-js`).

Currently, the repo provides a remote attachment content type and will grow to provide more content types.

## Send a remote attachment

Use the [remote-attachment](https://github.com/xmtp/xmtp-js-content-types/tree/main/remote-attachment) package to enable your app to send and receive message attachments.

### What’s an attachment?

Attachments are files. More specifically, attachments are objects that have:

- `filename` Most files have names, at least the most common file types.
- `mimeType` What kind of file is it? You can often assume this from the file extension, but it's nice to have a specific field for it. [Here's a list of common mime types.](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)
- `data` What is this file's data? Most files have data. If the file doesn't have data then it's probably not the most interesting thing to send.

### Why remote attachments?

Because XMTP messages can only be up to 1MB in size, we need to store the attachment somewhere other than the XMTP network. In other words, we need to store it in a remote location.

### What about encryption?

End-to-end encryption must apply not only to XMTP messages, but to message attachments as well. For this reason, we need to encrypt the attachment before we store it.

### Create an attachment object

```tsx
const attachment: Attachment = {
  filename: "screenshot.png",
  mimeType: "image/png",
  data: [the PNG data]
}
```

### Create a preview attachment object

Once you have the attachment object created, you can also create a preview for what to show in a message input before sending:

```tsx
URL.createObjectURL(
              new Blob([Buffer.from(somePNGData)], {
                type: attachment.mimeType,
              }),
            ),
```

### Encrypt the attachment

Use the `RemoteAttachmentCodec.encodeEncrypted` to encrypt the attachment:

```tsx
// Import the codecs we're going to use
import {
  AttachmentCodec,
  RemoteAttachmentCodec
} from "xmtp-content-type-remote-attachment";

// Encode the attachment and encrypt that encoded content
const encryptedAttachment = await RemoteAttachmentCodec.encodeEncrypted(
  attachment,
  new AttachmentCodec(),
)
```

### Upload the encrypted attachment

Upload the encrypted attachment anywhere where it will be accessible via an HTTPS GET request. For example, you can use web3.storage:

```tsx
const web3Storage = new Web3Storage({
    token: "your web3.storage token here"
})

const upload = new Upload("XMTPEncryptedContent", encryptedEncoded.payload)
const cid = await web3Storage.put([upload]);
const url = `https://${cid}.ipfs.w3s.link/XMTPEncryptedContent`
```

*([Upload](https://github.com/xmtp-labs/xmtp-inbox-web/blob/5b45e05efbe0b0f49c17d66d7547be2c13a51eab/hooks/useSendMessage.ts#L15-L33) is a small class that implements Web3Storage's `Filelike` interface for uploading)*

### Create a remote attachment

Now that you have a `url`, you can create a `RemoteAttachment`.

```tsx
const remoteAttachment: RemoteAttachment = {
  // This is the URL string where clients can download the encrypted
  // encoded content
  url: url,

  // We hash the encrypted encoded payload and send that along with the
  // remote attachment. On the recipient side, clients can verify that the
  // encrypted encoded payload they've downloaded matches what was uploaded.
  // This is to prevent tampering with the content once it's been uploaded.
  contentDigest: encryptedAttachment.digest,

  // These are the encryption keys that will be used by the recipient to
  // decrypt the remote payload
  salt: encryptedAttachment.salt,
  nonce: encryptedAttachment.nonce,
  secret: encryptedAttachment.secret,

  // For now, all remote attachments MUST be fetchable via HTTPS GET requests.
  // We're investigating IPFS here among other options.
  scheme: "https://",

  // These fields are used by clients to display some information about
  // the remote attachment before it is downloaded and decrypted.
  filename: attachment.filename,
  contentLength: attachment.data.byteLength,
};
```

### Send a remote attachment

Now that you have a remote attachment, you can send it:

```tsx
await conversation.messages.send(remoteAttachment, {
  contentType: ContentTypeRemoteAttachment,
    contentFallback: "a screenshot of 1MB of text",
})
```

Note that we’re using `contentFallback` to enable clients that don't support these content types to still display something. For cases where clients *do* support these types, they can use the content fallback as alt text for accessibility purposes.

### Receive a remote attachment

Now that you can send a remote attachment, you need a way to receive a remote attachment. For example:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage()

if (!message.contentType.sameAs(ContentTypeRemoteAttachment)) {
    // We do not have a remote attachment. A topic for another blog post.
    return
}

// We've got a remote attachment.
const remoteAttachment: RemoteAttachment = message.content
```

### Download, decrypt, and decode the attachment

Now that you can receive a remote attachment, you need to download, decrypt, and decode it so your app can display it. For example:

```tsx
const attachment: Attachment = await RemoteAttachmentCodec.load(
    remoteAttachment,
    client, // <- Your XMTP Client instance
)
```

You now have the original attachment:

```tsx
attachment.filename // => "screenshot.png"
attachment.mimeType // => "image/png",
attachment.data // => [the PNG data]
```

### Display the attachment

Display the attachment in your app as you please. For example, you can display it as an image:

```tsx
const objectURL = URL.createObjectURL(
    new Blob([Buffer.from(attachment.data)], {
    type: attachment.mimeType,
  }),
);

const img = document.createElement('img')
img.src = objectURL
img.title = attachment.filename
```

To learn more, see [Some new content types](https://xmtp.org/blog/attachments-and-remote-attachments).
