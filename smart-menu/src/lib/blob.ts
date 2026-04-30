import { put } from "@vercel/blob";

export async function uploadModel(file: File, modelId: string): Promise<string> {
  const blob = await put(`ar-models/${modelId}/model.glb`, file, {
    access: "public",
    contentType: "model/gltf-binary",
  });
  return blob.url;
}
