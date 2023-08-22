import { Rule, ValidationField } from "../src/validator";

describe("Test validateField function", () => {
  test("validateField should return validator rule result", () => {
    document.body.innerHTML = "<input type='text'></text>";
    let rule: Rule = { name: "Always True", fn: (field) => true };
    let validationField = new ValidationField("input", rule);
    expect(validationField.validate()).toBe(true);
  });
});
