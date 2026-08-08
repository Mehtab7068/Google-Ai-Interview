const fs = require("fs");
const { SourceMapConsumer } = require("source-map");
const map = JSON.parse(fs.readFileSync("./dist/assets/index-CAhA94VN.js.map", "utf8"));
SourceMapConsumer.with(map, null, consumer => {
  const pos = consumer.originalPositionFor({ line: 835, column: 9803 });
  console.log(JSON.stringify(pos, null, 2));
});
