vrouter
=======
Virtual router for Advanced networking class. This is a naive cleanroom 
implementation from a person who hasn't done any advanced router configurations
or even deployed something larger than 4 port router, so expect the 
functionalities to very limited and probably wrong.

This is a work in progress document, so expect possible changes and improvements
as *vrouter* is being developed. Probably won't be anything more than a proof of
concept with a few advanced features.

Description
===========
This software simulates a very simple networking router with basic data 
manipulation abilities and routing logic. 

It is operating on three different ports:

*   4000 - incoming traffic
*   5000 - outgoing traffic
*   6000 - control messages

The clients that are connected to the router are in the *subnet* of the router.

Incoming traffic
----------------
When incoming data arrives from the client on port 4000, it is first checked
if it exists in the routing table. If it exists, the data is manipulated (if 
configured) and forwarded to the destination via port 5000 to a client 
in the subnet.  

If the data is outside the subnet, a router from the R2R table is selected 
which matches the data destination. If not, data is declared unroutable and an 
adequate control message is being sent back.

Mockup of the incoming data is the following:

`MESSAGE|[DATA]`

where `[MESSAGE]` is one of the following:
*   `HELLO` - registers in the subnet table
*   `R2R`    - message to register in the routing table
*   `CONTINUE`  - message to perform routing operations on the `DATA`
*   `END`   - deletes the socket from the routing table

Note that only `CONTINUE` accepts data. Commands without `DATA` must terminate
with `|`.

`DATA` can be one of the following:
*   `DEST:DATA` - where:
    *   `DEST` - destination IP
    *   `DATA` - raw data that will be parsed (if required) and routed
*   `EMPTY` - doesn't do anything; just a placeholder for padding

Several examples of incoming data are below:
*   `R2R|`  - registers the client as a router
*   `HELLO|EMPTY`   - registers the client as a member of the subnet
*   `CONTINUE|192.168.1.1:GOODMORNING`  - sends `GOODMORNING` to 192.168.1.1
*   `END|`   - deletes the entry in the routing table

Outgoing traffic
----------------
There are two kinds of routing tables which determine the exit of the data:
*   subnet routing table
*   router-to-router (R2R) table

Subnet routing table is a key-value pair data store which contains the addresses
of clients in the subnet, matched with their local destination addresses.

R2R table is also a key-value pair data store, but instead of subnet clients,
it contains the addresses of other routers that are connected to the instance
of *vrouter*.

When the incoming traffic gets passed over to another router, the process is
repeated if needed.

Outgoing data is the same as incoming data (since router is a proxy between
the incoming and outgoing data).


Control messages
----------------
Control messages represent commands sent directly to the router to alter its 
state, such as regeneration of routing tables and poweroff. Furthermore, This
channel is used to send back to the client when the messages are undeliverable.

Control message data is the following:
`[COMMAND]`

Where `[COMMAND]` is one of the following:
*   `FLUSH` - flushes all routing tables
*   `POWEROFF` - powers off the router
*   `DENYALL` - denies all incoming and outgoing traffic
*   `ALLOWALL` - allows all incoming and outgoing traffic

Data manipulation
-----------------
Furthermore, *vrouter* contains entry points for data filtering logic as well as duplication, redirection and holding, all extendible in the
`mutateData(data)` function.

License
-------
MIT