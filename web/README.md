1. Install AWS CLI
2. Install AWS CDK 
3. Run CDK deploy under the infra to deploy the stack 
4. Find the CDK output 
5. Fix user sign-up 

aws cognito-idp admin-create-user \
--user-pool-id us-east-1_WDc7Z6A75 \
--username hukaiyin-1234 \
--temporary-password liliangxinshijieH02! \
--user-attributes Name="email",Value="hukaiyin@amazon.com" \
--message-action "SUPPRESS" \
--desired-delivery-mediums "EMAIL"

aws cognito-idp admin-set-user-password \
--user-pool-id us-east-1_WDc7Z6A75 \
--username hukaiyin-1234 \
--password meilixinshijieH0! \
--permanent 

5. Change lambda bucket name role and allow resource to wild card 
