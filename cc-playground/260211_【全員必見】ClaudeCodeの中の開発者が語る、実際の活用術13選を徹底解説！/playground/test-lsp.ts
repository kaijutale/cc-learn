// typescript-lsp plugin test file

interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}

// Intentional type error for testing
const testUser: User = {
  id: 1,
  name: "camone",
  email: "test@example.com",
};

const greeting = greetUser(testUser);
console.log(greeting);

// Fixed: correct types now
const goodUser: User = {
  id: 2,
  name: "fixed",
  email: "fixed@example.com",
};

// New intentional error: missing required field
const incompleteUser: User = {
  id: 3,
  name: "incomplete",
};
