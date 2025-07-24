# Open Questions

The following is a list of open questions regarding the GraphQL schema design.
Collected here as they may become easier to answer as the schema evolves.

1. Do B2B "Users" simply become Storefront "Customers" that happens to have a "role" and "company"?

2. CRUD vs task-based naming conventions, cascading deletes vs archiving

   - "company.deregisterCustomer" vs "company.deleteCustomer"
   - "company.archiveShoppingList" vs "company.deleteShoppingList"

3. Is "clear active-company" really a feature? what can users do when they are not acting on behalf of a company, that they can't while they are?
   For b2b users, only "super-admins" can be on a "non-company" state. Can we default them to the last company they were on and remove the clear mutation and tweak the "My Orders" page to always display all orders for the users, regardless of the active company. They could further filter in the page using search filters.

4. In B2C Shopping lists are owned by a Customer, in B2B they are collaborative - where to namespace them?

   - in both `Customer` and `Company`?
   - in its own root type, e.g. `ShoppingList`?
   - or can B2B `Customer`s only have shopping lists under `Company`?

5. Do we allow for recursive queries? E.g. `Company.subsidiaries` bringing back more Companies with their own `subsidiaries`

   - If so, how is the BE limiting overly complex or deep queries?

6. Can we rely on `activeCompany.set` to invalidate/swap carts on the BE, rather than it being an additional call from the FE?

7. We need an endpoint elsewhere to upload files for company registration.
