export interface Category {
  id?: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface CategoryCreateDTO {
  name: string;
  description: string;
}
