import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Define types for categories and tags
export type Category = {
  id?: string;
  name: string;
  description: string;
};

export type Tag = {
  id?: string;
  name: string;
  category: string;
};

// Function to fetch categories from Firestore
export async function fetchCategories() {
  try {
    const categoriesRef = collection(db, "categories");
    const categoriesSnapshot = await getDocs(categoriesRef);

    const categories: Category[] = categoriesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Category)
    );

    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      categories: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to fetch tags from Firestore
export async function fetchTags() {
  try {
    const tagsRef = collection(db, "tags");
    const tagsSnapshot = await getDocs(tagsRef);

    const tags: Tag[] = tagsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Tag)
    );

    return { success: true, tags };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return {
      success: false,
      tags: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to fetch categories with their tags
export async function fetchCategoriesWithTags() {
  try {
    const [categoriesResult, tagsResult] = await Promise.all([
      fetchCategories(),
      fetchTags(),
    ]);

    if (!categoriesResult.success || !tagsResult.success) {
      throw new Error("Failed to fetch categories or tags");
    }

    // Group tags by category
    const categoriesWithTags = categoriesResult.categories.map((category) => ({
      ...category,
      tags: tagsResult.tags.filter((tag) => tag.category === category.name),
    }));

    return {
      success: true,
      categoriesWithTags,
    };
  } catch (error) {
    console.error("Error fetching categories with tags:", error);
    return {
      success: false,
      categoriesWithTags: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
