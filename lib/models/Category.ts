export type Category = {
  id?: string;
  name: string;
  description: string;
  createdAt: string;
};

export type CategoryCreateDTO = {
  name: string;
  description: string;
};
