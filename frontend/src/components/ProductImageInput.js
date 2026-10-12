import React, { useEffect, useState } from "react";
import { getProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "../utils/productImages";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function ProductImageInput({ image, imageFile, onImageChange, onFileChange }) {
  const [fileError, setFileError] = useState("");
  const [filePreview, setFilePreview] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setFilePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setFilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileError("");
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFileError("Faqat JPG yoki PNG formatdagi rasmni tanlang.");
      event.target.value = "";
      onFileChange(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFileError("Rasm hajmi 5 MB dan oshmasligi kerak.");
      event.target.value = "";
      onFileChange(null);
      return;
    }

    onImageChange("");
    onFileChange(file);
  };

  const previewSource = filePreview || getProductImageUrl(image);

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Rasm yuklash <span className="font-normal text-slate-500">(tavsiya qilinadi)</span>
          </label>
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-4 py-4 text-center transition hover:border-violet-400 hover:bg-violet-50">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-2 h-6 w-6 text-violet-700">
              <path d="M12 16V4m0 0L7 9m5-5 5 5" />
              <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
            </svg>
            <span className="text-sm font-semibold text-violet-800">
              {imageFile ? "Boshqa rasm tanlash" : "Kompyuterdan rasm tanlang"}
            </span>
            <span className="mt-1 text-xs text-slate-500">JPG yoki PNG, 5 MB gacha</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {imageFile && (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600">
              <span className="min-w-0 truncate">{imageFile.name}</span>
              <button
                type="button"
                onClick={() => {
                  onFileChange(null);
                  setFileError("");
                }}
                className="shrink-0 font-semibold text-rose-600 hover:text-rose-800"
              >
                Olib tashlash
              </button>
            </div>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold text-slate-700">Rasm ko'rinishi</span>
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#f2f4f7] p-2">
            <img
              src={previewSource}
              alt="Mahsulot rasmi ko'rinishi"
              className="h-full w-full object-contain"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = PRODUCT_IMAGE_FALLBACK;
              }}
            />
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-slate-700">
          Yoki rasm havolasini kiriting
        </span>
        <input
          type="text"
          inputMode="url"
          name="image"
          value={image}
          onChange={(event) => {
            onImageChange(event.target.value);
            onFileChange(null);
            setFileError("");
          }}
          placeholder="https://example.com/rasm.jpg"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
      </label>
      {fileError && (
        <p role="alert" className="text-sm text-rose-600">
          {fileError}
        </p>
      )}
    </div>
  );
}

export default ProductImageInput;
