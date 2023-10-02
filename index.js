const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // 버킷 명
  const Key = decodeURIComponent(event.Records[0].s3.object.key); // 파일 주소
  const filename = Key.split("/").at(-1); // 파일 이름
  const ext = Key.split(".").at(-1).toLowerCase(); // 파일 확장자
  const requiredFormat = ext === "jpg" ? "jpeg" : ext; // jpg면 jpeg로 전환
  console.log("name", filename, "ext", ext);

  try {
    // 이미지 리사이징
    const getObject = await s3.send(new GetObjectCommand({ Bucket, Key }));
    const buffers = [];
    for await (const data of getObject.Body) {
      buffers.push(data);
    }
    const imageBuffer = Buffer.concat(buffers);
    console.log("original", s3Object.Body.length); // 용량 체크
    const resizedImage = await sharp(imageBuffer)
      .resize(200, 200, { fit: "inside" })
      .toFormat(requiredFormat)
      .toBuffer();

    // 다시 s3로 보냄
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: `thumb/${filename}`,
        Body: resizedImage,
      })
    );
    console.log("put", resizedImage.length); // 용량 체크
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
