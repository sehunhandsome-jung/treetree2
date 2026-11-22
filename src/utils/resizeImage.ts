/*
  휴대폰 원본 사진(3~10MB)을 그대로 보내면 터널이나 모바일 데이터에서
  업로드가 오래 걸리고 AI 판정도 느려진다. 긴 변 1280px JPEG로 줄여서
  보낸다. 줄이기에 실패하면 원본을 그대로 쓴다(서버가 형식·용량을
  다시 검사한다).
*/
const MAX_LONG_SIDE = 1280;
const JPEG_QUALITY = 0.82;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };

    image.src = url;
  });
}

export async function resizeImageForUpload(file: File) {
  try {
    const image = await loadImage(file);
    const scale = Math.min(
      1,
      MAX_LONG_SIDE /
        Math.max(image.naturalWidth, image.naturalHeight)
    );

    if (scale === 1 && file.type === "image/jpeg") {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    /* 투명한 PNG가 JPEG로 바뀌며 검게 칠해지지 않게 한다. */
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    if (!blob) {
      return file;
    }

    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "")}.jpg`,
      { type: "image/jpeg" }
    );
  } catch {
    return file;
  }
}
