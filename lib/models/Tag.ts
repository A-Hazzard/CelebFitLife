export interface Tag {
  id?: string;
  name: string;
  category: string;
  createdAt: string;
}

export interface TagCreateDTO {
  name: string;
  category: string;
}
