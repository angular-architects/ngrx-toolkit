export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  isbn: string;
  inStock: boolean;
}

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: 1925,
    isbn: '978-0-7432-7356-5',
    inStock: true,
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    year: 1949,
    isbn: '978-0-452-28423-4',
    inStock: true,
  },
  {
    id: '3',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    year: 1960,
    isbn: '978-0-06-112008-4',
    inStock: false,
  },
  {
    id: '4',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: 1813,
    isbn: '978-0-14-143951-8',
    inStock: true,
  },
  {
    id: '5',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    year: 1951,
    isbn: '978-0-316-76948-0',
    inStock: false,
  },
];
