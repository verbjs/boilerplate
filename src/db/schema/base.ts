export default interface Base {
  id: string;
  createdAt: number;
  updatedAt: number;
  meta?: Record<string, any>;
}
