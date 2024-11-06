-- @block createUsers
create user counseling_owner;
create user counseling_authenticator noinherit;
create user counseling_visitor;

-- @block createDatabases
create database counseling_db owner counseling_owner;
create database counseling_db_shadow owner counseling_owner;

-- @block grantPrivileges
grant connect on database counseling_db, counseling_db_shadow to counseling_authenticator, counseling_visitor;
grant all on database counseling_db, counseling_db_shadow to counseling_owner;
grant counseling_visitor to counseling_authenticator;
