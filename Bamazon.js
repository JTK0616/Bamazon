// Require mysql and inquirer npm packages

var mysql = require("mysql");
var inquirer = require("inquirer");

// Connect to mysql database

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  port: 8889,
  database : 'Bamazon'
});

connection.connect(function(err) {
  if (err) throw err;
  // console.log("Connected!");
});



// Prompt the User:  View Items or Buy Items

var start = function() {
  inquirer.prompt({
    name: "ViewOrBuy",
    type: "rawlist",
    message: "Would you like to [VIEW] all items or [BUY] an item?",
    choices: ["VIEW", "BUY"]
  }).then(function(answer) {

    // Based on the user's answer, call the viewItems or BuyItems function

    if (answer.ViewOrBuy.toUpperCase() === "VIEW") {
      viewItems();
    }
    else {
      buyItems();
    }
  });
};


// Function to get all items available for purchase, and allow user to buy an item

var buyItems = function() {

  // Query the database for all items available for sale

  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;

    // Prompt the user for which item they'd like to buy

    inquirer.prompt([
      {
        name: "choice",
        type: "rawlist",
        pageSize: 15,
        choices: function() {
          var choiceArray = [];
          for (var i = 0; i < results.length; i++) {
            choiceArray.push(results[i].product_name);
          }
          return choiceArray;
        },
        message: "What item would you like to buy?"
      },
      {
        name: "quantity",
        type: "input",
        message: "How many would you like to buy?"
      }
    ]).then(function(answer) {

      // Get the information of the chosen item

      var chosenItem;
      for (var i = 0; i < results.length; i++) {
        if (results[i].product_name === answer.choice) {
          chosenItem = results[i];
        }
      }

      // Determine if there is sufficient inventory in stock

      if (chosenItem.stock_quantity >= parseInt(answer.quantity)) {

        // Inventory exists, so update database, let the user know, and start over

        connection.query("UPDATE products SET ? WHERE ?", [{
          stock_quantity: chosenItem.stock_quantity-answer.quantity
        }, {
          item_id: chosenItem.item_id
        }], function(error) {
          if (error) throw err;
          console.log("Item(s) successfully purchased!");
          console.log("Your Total Price is: " + chosenItem.price * answer.quantity)
          start();
        });
      }
      else {

        // Not enough inventory. Inform the user.  Start over.

        console.log("Not enough inventory exists.  Please try again.");
        start();
      }
    });
  });
};

var viewItems = function() {
	connection.query("SELECT * FROM products", function(err, res) {
  for (var i = 0; i < res.length; i++) {
    console.log('\n' + res[i].item_id + " | " + res[i].product_name + " | Price: " + res[i].price + " | Qty: " + res[i].stock_quantity) + '\n';
  }
  start();
})
	
};

// run the start function when the file is loaded to prompt the user
start();


