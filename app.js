const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname +  "/date.js");
const _ = require("lodash");
const PORT = process.env.PORT || 3000;
require('dotenv').config();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true }));
app.use(express.static("public"));

// mongodb+srv://admin-shishir:<password>@cluster0.ehfkqij.mongodb.net/?retryWrites=true&w=majority
// # ----- MongoDB ATLAS Connection ----//
mongoose.set('strictQuery', false);
 mongoose.connect(process.env.ATLAS_URL,{useNewUrlParser: true, useUnifiedTopology: true}, function(err){
   if (err) {
     console.log(err);
   }else {
     console.log("Connected to mongodb");
   }
 });

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }

});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome ",
});
const item2 = new Item ({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit thus to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
  // itemsSchema
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();

app.get("/", function(req, res) {

    Item.find({}, function (err, foundItems) {
      // console.log(foundItems);
      if(foundItems.length ===0){
        Item.insertMany( defaultItems, function(err){
        if (err) {
          console.log(err);
        }else {
          console.log("Successfully inserted defaultItems to DB");
        }
        });
        res.redirect("/");
      }else {

        res.render("list", {listTitle: day , newListItems: foundItems});
      }
    });

});
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList){
        // console.log("Doesn't exists1");
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName)
      }else {
        // console.log("exists!");
        // Show an existing list
        res.render("list", {listTitle: foundList.name , newListItems: foundList.items})
      }
    }
  })

})
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === day){
    item.save();
    res.redirect("/");
  }else {
    List.findOne({name: listName},function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

})

app.post("/delete", function(req,res){
  // console.log(req.body.checkbox);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === day){
  Item.findByIdAndRemove( checkedItemId, function(err){
    if(err){
      console.log(err);
    }else {
      console.log("Deleted Successfully");
      res.redirect("/");
    }
  })
}else{
  List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId} }}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
    }
  })
}
});


app.get("/about", function(req,res){
  res.render("about");
})




app.listen(PORT, () => {
  console.log("Server is running on port ${PORT}");
})
