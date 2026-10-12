export function getCategoryPath(categories, categoryOrId) {
  const target = categories.find(
    (category) =>
      category.id === Number(categoryOrId) || category.name === categoryOrId,
  );
  if (!target) return String(categoryOrId || "");

  const path = [];
  const visited = new Set();
  let current = target;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.name);
    if (current.parent_id === null) break;
    current = categories.find((category) => category.id === current.parent_id);
  }
  return path.join(" › ");
}

export function getCategoryDescendantNames(categories, categoryName) {
  const selected = categories.find((category) => category.name === categoryName);
  if (!selected) return new Set([categoryName]);

  const names = new Set([selected.name]);
  const pending = [selected.id];
  while (pending.length > 0) {
    const parentId = pending.pop();
    categories
      .filter((category) => category.parent_id === parentId)
      .forEach((child) => {
        if (!names.has(child.name)) {
          names.add(child.name);
          pending.push(child.id);
        }
      });
  }
  return names;
}

export function getFlattenedCategories(categories, excludedIds = new Set()) {
  const childrenByParent = new Map();
  categories.forEach((category) => {
    const siblings = childrenByParent.get(category.parent_id) || [];
    siblings.push(category);
    childrenByParent.set(category.parent_id, siblings);
  });
  childrenByParent.forEach((siblings) =>
    siblings.sort((first, second) => first.name.localeCompare(second.name, "uz")),
  );

  const flattened = [];
  const visit = (parentId, depth, ancestors) => {
    (childrenByParent.get(parentId) || []).forEach((category) => {
      if (excludedIds.has(category.id) || ancestors.has(category.id)) return;
      flattened.push({
        ...category,
        depth,
        path: getCategoryPath(categories, category.id),
      });
      const nextAncestors = new Set(ancestors);
      nextAncestors.add(category.id);
      visit(category.id, depth + 1, nextAncestors);
    });
  };
  visit(null, 0, new Set());

  categories
    .filter(
      (category) =>
        !flattened.some((item) => item.id === category.id) &&
        !excludedIds.has(category.id),
    )
    .forEach((category) =>
      flattened.push({
        ...category,
        depth: 0,
        path: getCategoryPath(categories, category.id),
      }),
    );
  return flattened;
}
