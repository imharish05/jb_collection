const http = require("http");

function fetch(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5000/api${path}`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          data: data.slice(0, 500)
        });
      });
    }).on("error", (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  console.log("Fetching /products...");
  console.log(await fetch("/products"));
  
  console.log("Fetching /dashboard/stats...");
  console.log(await fetch("/dashboard/stats"));
  
  console.log("Fetching /delivery-zones...");
  console.log(await fetch("/delivery-zones"));
}
run();
