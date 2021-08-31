import { format } from "./formatter";
const fs = require("fs");
const fileText = fs.readFileSync("./src/teste.html");

fs.writeFileSync(
  "./src/nFile.html",
  format(String(fileText), {
    closeTagSameLine: true,
    indentation: 4,
    useSpaces: false,
    attrOrder: ["*", "[", "("],
  })
);
