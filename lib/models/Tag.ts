export type Tag = {
  id?: string;
  name: string;
  category: string;
  createdAt: string;
};

export type TagCreateDTO = {
  name: string;
  category: string;
};
