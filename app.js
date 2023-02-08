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
const contactsSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    Phone: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
});
const Item = mongoose.model("Item", itemsSchema);
const Contact = mongoose.model("Contact",contactsSchema);

const item1 = new Item ({
  name: "Welcome!",
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

app.get("/about", function(req,res){
  res.render("about");
});
app.get("/contact", function(req,res){
  res.render("contact");
});
app.get("/allList", function(req,res){
  List.find({},function(err,foundLists){
    console.log(foundLists);
    res.render("allList",{
    newLists:foundLists
    });
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
  });

});
app.post("/", function(req, res){
  const newListName = req.body.newList;
  // console.log(newListName);
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
    });
  }

});

app.post("/contact", function(req, res,err){
     
      const formData = req.body;
      const contact= new Contact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      });
       
      // contact.save();
      res.redirect("/");
      
      // if(err){
      //   console.log(err);
      // }else{
      //   contact.save();
      //   res.redirect("/");
      //   console.log("submitted");
      // }
});
app.post("/new",function(req,res){
  const newList = req.body.newList;
  res.redirect("/"+ newList);
})

app.post("/deleteList",function(req,res){
  const deletingList = req.body.deletingList;
  List.findByIdAndDelete(deletingList,function(err){
    if(!err){
      res.redirect("/allList");
    }
  })
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
  });
}else{
  List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId} }}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
    }
  });
}
});







app.listen(PORT, ( ) => {
  console.log("Server is running on port 3000");
});
