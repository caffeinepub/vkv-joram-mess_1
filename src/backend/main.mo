import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Mixin Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile type as required by frontend
  public type UserProfile = {
    username : Text;
    role : Text; // "admin" or "staff"
  };

  // Data types
  type User = {
    id : Principal;
    username : Text;
    createdAt : Time.Time;
    role : Text; // "admin" or "staff"
  };

  module User {
    public func compareByUsername(user1 : User, user2 : User) : Order.Order {
      Text.compare(user1.username, user2.username);
    };
  };

  type MessEntry = {
    id : Principal;
    date : Text;
    itemName : Text;
    quantity : Float;
    unit : Text;
    pricePerUnit : Float;
    totalCost : Float;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  type StudentCount = {
    id : Principal;
    date : Text;
    totalStudents : Nat;
    studentsPresent : Nat;
    studentsOnLeave : Nat;
    perStudentCost : Float;
    createdAt : Time.Time;
  };

  type Purchase = {
    id : Principal;
    date : Text;
    supplier : Text;
    itemName : Text;
    quantity : Float;
    unit : Text;
    pricePerUnit : Float;
    totalPurchase : Float;
    createdAt : Time.Time;
  };

  type Inventory = {
    id : Principal;
    itemName : Text;
    quantityPurchased : Float;
    quantityUsed : Float;
    remainingStock : Float;
    unit : Text;
    updatedAt : Time.Time;
  };

  type FoodCategory = {
    id : Principal;
    name : Text;
    isActive : Bool;
  };

  type Setting = {
    key : Text;
    value : Text;
  };

  // Persistent data structures
  let users = Map.empty<Principal, User>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let messEntries = Map.empty<Principal, MessEntry>();
  let studentCounts = Map.empty<Principal, StudentCount>();
  let purchases = Map.empty<Principal, Purchase>();
  let inventory = Map.empty<Principal, Inventory>();
  let foodCategories = Map.empty<Principal, FoodCategory>();
  let settings = Map.empty<Text, Setting>();

  // Counter for generating unique IDs
  var nextId : Nat = 0;

  func generatePrincipal() : Principal {
    nextId += 1;
    nextId.toText().encodeUtf8().fromBlob();
  };

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User Management
  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all users");
    };
    users.values().toArray().sort(User.compareByUsername);
  };

  public shared ({ caller }) func createUser(username : Text, role : Text) : async Principal {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can create users");
    };

    let newUserId = generatePrincipal();
    let user : User = {
      id = newUserId;
      username;
      createdAt = Time.now();
      role;
    };
    users.add(newUserId, user);

    // Assign role in access control system
    let accessRole = if (role == "admin") { #admin } else { #user };
    AccessControl.assignRole(accessControlState, caller, newUserId, accessRole);

    newUserId;
  };

  public shared ({ caller }) func updateUser(userId : Principal, username : Text, role : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update users");
    };

    switch (users.get(userId)) {
      case null { Runtime.trap("User not found"); };
      case (?existingUser) {
        let updatedUser : User = {
          id = existingUser.id;
          username;
          createdAt = existingUser.createdAt;
          role;
        };
        users.add(userId, updatedUser);

        // Update role in access control system
        let accessRole = if (role == "admin") { #admin } else { #user };
        AccessControl.assignRole(accessControlState, caller, userId, accessRole);
      };
    };
  };

  public shared ({ caller }) func deleteUser(userId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete users");
    };
    users.remove(userId);
    userProfiles.remove(userId);
  };

  // Mess Entries
  public shared ({ caller }) func createMessEntry(
    date : Text,
    itemName : Text,
    quantity : Float,
    unit : Text,
    pricePerUnit : Float
  ) : async Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can add entries");
    };

    let entryId = generatePrincipal();
    let entry : MessEntry = {
      id = entryId;
      date;
      itemName;
      quantity;
      unit;
      pricePerUnit;
      totalCost = quantity * pricePerUnit;
      createdBy = caller;
      createdAt = Time.now();
    };
    messEntries.add(entryId, entry);
    entryId;
  };

  public shared ({ caller }) func updateMessEntry(
    entryId : Principal,
    date : Text,
    itemName : Text,
    quantity : Float,
    unit : Text,
    pricePerUnit : Float
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can update entries");
    };

    switch (messEntries.get(entryId)) {
      case null { Runtime.trap("Entry not found"); };
      case (?existingEntry) {
        // Staff can only update their own entries, admin can update any
        if (existingEntry.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own entries");
        };

        let updatedEntry : MessEntry = {
          id = existingEntry.id;
          date;
          itemName;
          quantity;
          unit;
          pricePerUnit;
          totalCost = quantity * pricePerUnit;
          createdBy = existingEntry.createdBy;
          createdAt = existingEntry.createdAt;
        };
        messEntries.add(entryId, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteMessEntry(entryId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can delete entries");
    };

    switch (messEntries.get(entryId)) {
      case null { Runtime.trap("Entry not found"); };
      case (?entry) {
        // Staff can only delete their own entries, admin can delete any
        if (entry.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own entries");
        };
        messEntries.remove(entryId);
      };
    };
  };

  public query ({ caller }) func getMessEntriesByDate(date : Text) : async [MessEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view entries");
    };
    messEntries.values().toArray().filter(func(entry) { entry.date == date });
  };

  public query ({ caller }) func getAllMessEntries() : async [MessEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view entries");
    };
    messEntries.values().toArray();
  };

  // Student Counts
  public shared ({ caller }) func createStudentCount(
    date : Text,
    totalStudents : Nat,
    studentsPresent : Nat,
    perStudentCost : Float
  ) : async Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can add student counts");
    };

    let countId = generatePrincipal();
    let count : StudentCount = {
      id = countId;
      date;
      totalStudents;
      studentsPresent;
      studentsOnLeave = totalStudents - studentsPresent;
      perStudentCost;
      createdAt = Time.now();
    };
    studentCounts.add(countId, count);
    countId;
  };

  public shared ({ caller }) func updateStudentCount(
    countId : Principal,
    date : Text,
    totalStudents : Nat,
    studentsPresent : Nat,
    perStudentCost : Float
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can update student counts");
    };

    switch (studentCounts.get(countId)) {
      case null { Runtime.trap("Student count not found"); };
      case (?existingCount) {
        let updatedCount : StudentCount = {
          id = existingCount.id;
          date;
          totalStudents;
          studentsPresent;
          studentsOnLeave = totalStudents - studentsPresent;
          perStudentCost;
          createdAt = existingCount.createdAt;
        };
        studentCounts.add(countId, updatedCount);
      };
    };
  };

  public shared ({ caller }) func deleteStudentCount(countId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete student counts");
    };
    studentCounts.remove(countId);
  };

  public query ({ caller }) func getStudentCountsByDate(date : Text) : async [StudentCount] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view student counts");
    };
    studentCounts.values().toArray().filter(func(count) { count.date == date });
  };

  public query ({ caller }) func getAllStudentCounts() : async [StudentCount] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view student counts");
    };
    studentCounts.values().toArray();
  };

  // Purchases
  public shared ({ caller }) func createPurchase(
    date : Text,
    supplier : Text,
    itemName : Text,
    quantity : Float,
    unit : Text,
    pricePerUnit : Float
  ) : async Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can add purchases");
    };

    let purchaseId = generatePrincipal();
    let purchase : Purchase = {
      id = purchaseId;
      date;
      supplier;
      itemName;
      quantity;
      unit;
      pricePerUnit;
      totalPurchase = quantity * pricePerUnit;
      createdAt = Time.now();
    };
    purchases.add(purchaseId, purchase);
    purchaseId;
  };

  public shared ({ caller }) func updatePurchase(
    purchaseId : Principal,
    date : Text,
    supplier : Text,
    itemName : Text,
    quantity : Float,
    unit : Text,
    pricePerUnit : Float
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can update purchases");
    };

    switch (purchases.get(purchaseId)) {
      case null { Runtime.trap("Purchase not found"); };
      case (?existingPurchase) {
        let updatedPurchase : Purchase = {
          id = existingPurchase.id;
          date;
          supplier;
          itemName;
          quantity;
          unit;
          pricePerUnit;
          totalPurchase = quantity * pricePerUnit;
          createdAt = existingPurchase.createdAt;
        };
        purchases.add(purchaseId, updatedPurchase);
      };
    };
  };

  public shared ({ caller }) func deletePurchase(purchaseId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete purchases");
    };
    purchases.remove(purchaseId);
  };

  public query ({ caller }) func getPurchasesByDateRange(startDate : Text, endDate : Text) : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view purchases");
    };
    purchases.values().toArray().filter(
      func(purchase) {
        purchase.date >= startDate and purchase.date <= endDate
      }
    );
  };

  public query ({ caller }) func getAllPurchases() : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view purchases");
    };
    purchases.values().toArray();
  };

  // Inventory
  public shared ({ caller }) func createInventory(
    itemName : Text,
    quantityPurchased : Float,
    quantityUsed : Float,
    unit : Text
  ) : async Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can add inventory");
    };

    let inventoryId = generatePrincipal();
    let item : Inventory = {
      id = inventoryId;
      itemName;
      quantityPurchased;
      quantityUsed;
      remainingStock = quantityPurchased - quantityUsed;
      unit;
      updatedAt = Time.now();
    };
    inventory.add(inventoryId, item);
    inventoryId;
  };

  public shared ({ caller }) func updateInventory(
    inventoryId : Principal,
    itemName : Text,
    quantityPurchased : Float,
    quantityUsed : Float,
    unit : Text
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users and staff can update inventory");
    };

    switch (inventory.get(inventoryId)) {
      case null { Runtime.trap("Inventory item not found"); };
      case (?existingItem) {
        let updatedItem : Inventory = {
          id = existingItem.id;
          itemName;
          quantityPurchased;
          quantityUsed;
          remainingStock = quantityPurchased - quantityUsed;
          unit;
          updatedAt = Time.now();
        };
        inventory.add(inventoryId, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deleteInventory(inventoryId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete inventory items");
    };
    inventory.remove(inventoryId);
  };

  public query ({ caller }) func getAllInventory() : async [Inventory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view inventory");
    };
    inventory.values().toArray();
  };

  public query ({ caller }) func getInventoryByItemName(itemName : Text) : async ?Inventory {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view inventory");
    };
    let items = inventory.values().toArray().filter(func(item) { item.itemName == itemName });
    if (items.size() > 0) { ?items[0] } else { null };
  };

  // Food Categories
  public shared ({ caller }) func createFoodCategory(name : Text, isActive : Bool) : async Principal {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can create food categories");
    };

    let categoryId = generatePrincipal();
    let category : FoodCategory = {
      id = categoryId;
      name;
      isActive;
    };
    foodCategories.add(categoryId, category);
    categoryId;
  };

  public shared ({ caller }) func updateFoodCategory(categoryId : Principal, name : Text, isActive : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update food categories");
    };

    switch (foodCategories.get(categoryId)) {
      case null { Runtime.trap("Food category not found"); };
      case (?existingCategory) {
        let updatedCategory : FoodCategory = {
          id = existingCategory.id;
          name;
          isActive;
        };
        foodCategories.add(categoryId, updatedCategory);
      };
    };
  };

  public shared ({ caller }) func deleteFoodCategory(categoryId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete food categories");
    };
    foodCategories.remove(categoryId);
  };

  public query ({ caller }) func getAllFoodCategories() : async [FoodCategory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view food categories");
    };
    foodCategories.values().toArray();
  };

  // Settings
  public shared ({ caller }) func updateSetting(key : Text, value : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update settings");
    };
    let setting = { key; value };
    settings.add(key, setting);
  };

  public query ({ caller }) func getSetting(key : Text) : async ?Setting {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view settings");
    };
    settings.get(key);
  };

  public query ({ caller }) func getAllSettings() : async [Setting] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view settings");
    };
    settings.values().toArray();
  };

  // Reports (query functions)
  public query ({ caller }) func getDailyReport(date : Text) : async {
    entries : [MessEntry];
    studentCount : ?StudentCount;
    totalCost : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };

    let entries = messEntries.values().toArray().filter(func(entry) { entry.date == date });
    let counts = studentCounts.values().toArray().filter(func(count) { count.date == date });
    let studentCount = if (counts.size() > 0) { ?counts[0] } else { null };

    var totalCost : Float = 0.0;
    for (entry in entries.vals()) {
      totalCost += entry.totalCost;
    };

    { entries; studentCount; totalCost };
  };

  public query ({ caller }) func getMonthlyReport(month : Text, year : Text) : async {
    totalExpense : Float;
    entriesByCategory : [(Text, Float)];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };

    let monthPrefix = year # month;
    let entries = messEntries.values().toArray().filter(
      func(entry) { entry.date.startsWith(#text monthPrefix) }
    );

    var totalExpense : Float = 0.0;
    for (entry in entries.vals()) {
      totalExpense += entry.totalCost;
    };

    // Simplified category aggregation
    let entriesByCategory : [(Text, Float)] = [];

    { totalExpense; entriesByCategory };
  };

  public query ({ caller }) func getGroceryConsumptionReport(month : Text, year : Text) : async [Inventory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    inventory.values().toArray();
  };
};
