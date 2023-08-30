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

  let inputField: HTMLInputElement;
  beforeEach(() => {
    document.body.innerHTML = `
    <form>
      <input type="text"/>
    </form>
    `;
    inputField = document.querySelector("input") as HTMLInputElement;
  });

  test("validate should return true if input matching query passes all supplied rules", () => {
    let validator = new FormValidator("form");
    validator.addField("input", [anyARule, upperCaseARule]);
    let input = document.querySelector("input") as HTMLInputElement;
    input.value = "A";
    expect(validator.validateField("input")).toStrictEqual(true);
  });
});
