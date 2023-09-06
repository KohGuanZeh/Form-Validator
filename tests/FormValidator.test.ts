import { Rule, FormValidator } from "../src/FormValidation";

describe("Test validate", () => {
  const anyARule: Rule = {
    name: "Is Case Insensitve A",
    fn: (field) => field.value.toLowerCase() === "a",
  };

  const upperCaseARule: Rule = {
    name: "Is Upper Case A",
    fn: (field) => field.value == "A",
  };

  let validator: FormValidator;
  let inputField: HTMLInputElement;
  beforeEach(() => {
    document.body.innerHTML = `
    <form>
      <input name="input-1" type="text"/>
    </form>
    `;
    validator = new FormValidator("form");
    inputField = document.querySelector("input") as HTMLInputElement;
  });

  test("validate should return true if input matching selector passes all supplied rules", () => {
    validator.addField("input", [anyARule, upperCaseARule]);
    inputField.value = "A";
    expect(validator.validateField("input")).toStrictEqual(true);
  });

  test("validate should return false if selector was not registered under addField", () => {
    validator.addField("input", [anyARule, upperCaseARule]);
    inputField.value = "A";
    let unAddedSelector = "[name='input-1']";
    expect(document.querySelector(unAddedSelector)).toStrictEqual(inputField);
    expect(() => validator.validateField(unAddedSelector)).toThrowError("Unidentified selector.");
  });
});
