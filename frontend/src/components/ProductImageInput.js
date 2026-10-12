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
    <div className="grid items-end gap-2 sm:grid-cols-[minmax(150px,0.7fr)_minmax(0,2fr)_3.25rem]">
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-800">Rasm yuklash</span>
        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition hover:border-indigo-500 hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-200">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-indigo-800">
            <path d="M12 16V4m0 0L7 9m5-5 5 5" />
            <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
          </svg>
          <span className="truncate">{imageFile ? imageFile.name : "JPG / PNG tanlash"}</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      <label className="block min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-800">Yoki rasm havolasi</span>
        <input
          type="url"
          inputMode="url"
          name="image"
          value={image}
          onChange={(event) => {
            onImageChange(event.target.value);
            onFileChange(null);
            setFileError("");
          }}
          placeholder="https://example.com/rasm.jpg"
          className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <div className="relative hidden h-[3.25rem] w-[3.25rem] overflow-hidden rounded-lg border border-slate-300 bg-slate-100 p-1 sm:block">
        <img
          src={previewSource}
          alt="Mahsulot rasmi ko'rinishi"
          className="h-full w-full object-contain"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = PRODUCT_IMAGE_FALLBACK;
          }}
        />
        {imageFile && (
          <button
            type="button"
            onClick={() => {
              onFileChange(null);
              setFileError("");
            }}
            aria-label="Tanlangan rasmni olib tashlash"
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white hover:bg-rose-700"
          >
            ×
          </button>
        )}
      </div>
      {fileError && (
        <p role="alert" className="text-xs text-rose-700 sm:col-span-3">
          {fileError}
        </p>
      )}
    </div>
  );
}

export default ProductImageInput;
