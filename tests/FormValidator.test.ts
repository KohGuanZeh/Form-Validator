import { Rule, FormValidator } from "../src/FormValidation";

const anyARule: Rule = {
  name: "Is Case Insensitve A",
  fn: (field) => field.value.toLowerCase() === "a",
};

const upperCaseARule: Rule = {
  name: "Is Upper Case A",
  fn: (field) => field.value == "A",
};

describe("Test validateField", () => {
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

  test("validateField should return true if input matching selector passes all supplied rules", () => {
    validator.addField("input", [anyARule, upperCaseARule]);
    inputField.value = "A";
    expect(validator.validateField("input")).toStrictEqual(true);
  });

  test("validateField should throw error if selector was not registered under addField", () => {
    validator.addField("input", [anyARule, upperCaseARule]);
    inputField.value = "A";
    let unAddedSelector = "[name='input-1']";
    expect(document.querySelector(unAddedSelector)).toStrictEqual(inputField);
    expect(() => validator.validateField(unAddedSelector)).toThrowError(
      "Unidentified selector. The same selector should be used with addField"
    );
  });

  test("validateField should throw error if FormValidator cannot query for HTMLFormElement", () => {
    validator = new FormValidator("#form");
    validator.addField("input", [anyARule]);
    inputField.value = "a";
    expect(() => validator.validateField("input")).toThrowError(
      "Cannot query requested HTMLFormElement."
    );
  });
});

describe("Test validate", () => {
  let validator: FormValidator;
  let inputField1: HTMLInputElement;
  let inputField2: HTMLInputElement;
  beforeEach(() => {
    document.body.innerHTML = `
    <form>
      <input name="input-1" type="text">
      <input name="input-2" type="text">
    </form>
    `;
    validator = new FormValidator("form");
    inputField1 = document.querySelector("[name='input-1']") as HTMLInputElement;
    inputField2 = document.querySelector("[name='input-2']") as HTMLInputElement;
  });

  test("validate should return true if all fields passes their supplied rules", () => {
    validator.addField("[name='input-1']", [anyARule, upperCaseARule]);
    validator.addField("[name='input-2']", [anyARule]);
    inputField1.value = "A";
    inputField2.value = "a";
    expect(validator.validate()).toStrictEqual(true);
  });

  test("validate should throw error if FormValidator cannot query for HTMLFormElement", () => {
    validator = new FormValidator("#someOtherForm");
    validator.addField("[name='input-1']", [anyARule]);
    inputField1.value = "a";
    expect(() => validator.validate()).toThrowError("Cannot query requested HTMLFormElement.");
  });
});
