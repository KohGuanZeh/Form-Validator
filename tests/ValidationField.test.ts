import { Rule, ValidationField } from "../src/validator";

describe("Test validate", () => {
  const rules = [
    {
      name: "Is Case Insensitve A",
      fn: (field) => field.value.toLowerCase() === "a",
    },
    {
      name: "Is Upper Case A",
      fn: (field) => field.value === "A",
    },
  ];

  let inputField: HTMLInputElement;
  beforeEach(() => {
    document.body.innerHTML = "<input type='text'/>";
    inputField = document.querySelector("input") as HTMLInputElement;
  });

  test("validate should return true iff all supplied rule functions return true", () => {
    let validationField = new ValidationField("input", rules);
    inputField.value = "A";
    expect(validationField.validate()).toStrictEqual(true);
  });

  test("validate should return false if one of the rule function returns false", () => {
    let validationField = new ValidationField("input", rules);
    inputField.value = "a";
    expect(validationField.validate()).toStrictEqual(false);
  });
});
