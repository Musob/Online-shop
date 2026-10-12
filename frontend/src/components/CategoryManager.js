import React, { useMemo, useState } from "react";
import { getFlattenedCategories } from "../utils/categoryTree";

function CategoryManager({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const flattenedCategories = useMemo(
    () => getFlattenedCategories(categories),
    [categories],
  );

  const descendantsOf = (categoryId) => {
    const descendants = new Set([categoryId]);
    let hasNewDescendant = true;
    while (hasNewDescendant) {
      hasNewDescendant = false;
      categories.forEach((category) => {
        if (descendants.has(category.parent_id) && !descendants.has(category.id)) {
          descendants.add(category.id);
          hasNewDescendant = true;
        }
      });
    }
    return descendants;
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await onAddCategory(name.trim(), parentId ? Number(parentId) : null);
      setName("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Kategoriyani qo'shib bo'lmadi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const beginEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditParentId(category.parent_id ? String(category.parent_id) : "");
    setError("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await onUpdateCategory(editingId, {
        name: editName.trim(),
        parent_id: editParentId ? Number(editParentId) : null,
      });
      setEditingId(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Kategoriyani saqlab bo'lmadi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`"${category.name}" kategoriyasini o'chirmoqchimisiz?`)) {
      return;
    }
    setError("");
    try {
      await onDeleteCategory(category.id);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Kategoriyani o'chirib bo'lmadi.",
      );
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-700 bg-slate-800 px-3 py-3 text-white sm:px-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
          Katalog
        </p>
        <h2 className="mt-0.5 text-base font-extrabold text-white">
          Kategoriyalarni boshqarish
        </h2>
        <p className="mt-1 text-xs text-slate-300">
          Ichma-ich bo'limlar yarating, nomi yoki joylashuvini o'zgartiring.
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid gap-2 border-b border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-800">
            Kategoriya nomi
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="Masalan: Erkaklar kiyimi"
            required
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-800">
            Ichiga joylash
          </span>
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Asosiy kategoriya</option>
            {flattenedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.path}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="h-10 self-end rounded-lg bg-indigo-800 px-4 text-sm font-bold text-white transition hover:bg-indigo-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving ? "Saqlanmoqda..." : "Qo'shish"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mx-3 mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 sm:mx-4">
          {error}
        </p>
      )}

      <div className="divide-y divide-slate-100">
        {flattenedCategories.map((category) => {
          const isEditing = editingId === category.id;
          const parentOptions = isEditing
            ? getFlattenedCategories(categories, descendantsOf(category.id))
            : [];
          return (
            <div key={category.id} className="px-3 py-2 sm:px-4">
              {isEditing ? (
                <form onSubmit={handleUpdate} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                  <label className="sr-only" htmlFor={`category-name-${category.id}`}>Kategoriya nomi</label>
                  <input
                    id={`category-name-${category.id}`}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    maxLength={100}
                    required
                    className="h-10 min-w-0 rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                  <label className="sr-only" htmlFor={`category-parent-${category.id}`}>Ota kategoriya</label>
                  <select
                    id={`category-parent-${category.id}`}
                    value={editParentId}
                    onChange={(event) => setEditParentId(event.target.value)}
                    className="h-10 min-w-0 rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Asosiy kategoriya</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.path}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-10 rounded-lg bg-indigo-800 px-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Saqlash
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Bekor
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${category.depth * 18}px` }}>
                    {category.depth > 0 && (
                      <span aria-hidden="true" className="text-slate-500">↳</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{category.name}</p>
                      {category.depth > 0 && (
                        <p className="truncate text-xs text-slate-600">{category.path}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => beginEdit(category)}
                      aria-label={`${category.name} kategoriyasini tahrirlash`}
                      className="rounded-lg p-2 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-900"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path d="m14 6 4 4M4 20l4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      aria-label={`${category.name} kategoriyasini o'chirish`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {flattenedCategories.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            Hozircha kategoriya yo'q. Yuqoridagi formadan qo'shing.
          </p>
        )}
      </div>
    </section>
  );
}

export default CategoryManager;
