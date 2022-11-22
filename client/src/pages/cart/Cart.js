import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import { useGlobalContext } from "../../shared/context/GlobalContext";
import axios from "axios";

import "./Cart.css";
import "../../shared/style/common.css";

const Cart = () => {
  const { user } = useGlobalContext();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  // if there are errors, then navigate to err page
  useEffect(() => {
    if (errors.length > 0) {
      navigate("/error", {
        state: {
          errors: errors
        }
      });
    }
  }, [errors, navigate]);

  // validate user is logged in, navigate to error page if not
  useEffect(() => {
    if (!user) {
      navigate("/error", {
        state: {
          errors: [
            "Cannot view cart page when not logged in!"
          ]
        }
      });
    }
  }, [user, navigate]);

  // reset state of items and cart
  const resetState = async () => {
    let errs = [];

    // fetch items
    let itemsData = undefined;    
    (async () => {
      const { data } = await axios.get("/api/items");
      setItems(data);
      itemsData = data;
    })()
    .catch((err) => {
      console.log(err);
      if (err?.response?.data) {
        errs = errs.concat(err.response.data);
      }
    });

    // fetch user's cart items
    (async () => {
      // fetch cart items
      const { data } = await axios.get("/api/cart/current");
      console.log(data);
      setCart(data);    

      // set total cost
      let totalCost = 0;
      if (itemsData) {
        data.forEach((cartItem) => {
          const itemPrice = itemsData.find((item) => cartItem.itemId === item._id).itemPrice;
          totalCost += (+itemPrice * +cartItem.count);
        });
      } else {
        console.log("Items data is undefined");
      }
      console.log("Total cost: " + totalCost);
      setTotalCost(totalCost);
    })()
    .catch((err) => {
      console.log(err);   
      if (err?.response?.data) {
        errs = errs.concat(err.response.data);
      }
    });    

    setErrors(errs);
  };

  // reset state on component mount
  useEffect(() => {
    resetState();
  }, []);

  // change cart item counter
  const changeCartItemCount = async (cartItemId, delta) => { 
    setLoading(true);
    try {
      await axios.put(`/api/cart/${cartItemId}`, {
        delta
      });
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        setErrors(err.response.data);
      }
    }
    resetState();
    setLoading(false);
  };  

  const renderedCartItems = cart.map((cartItem) => {
    // find the item that this cart item is associated with
    const item = items.find((item) => item._id === cartItem.itemId);

    // make sure to convert vars to int using "+" sign at head!
    const totalCost = +cartItem.count * +item.itemPrice;

    return (
      <tr key={item._id}>
        <td className="cell">
          <h1 className="item-title">{item.itemName}</h1>
          <img className="item-img" src={item.imgSrc} alt=""/>
          <h3 className="item-type">{item.itemType}</h3>
            <Table striped bordered hover size="sm">
              <tbody>
                <tr>
                  <td>
                    <button 
                      disabled={loading || cartItem.count === 1}
                      onClick={() => changeCartItemCount(cartItem._id, -1)} 
                      className={cartItem.count === 1 ? "item-btn item-btn-grey" : "item-btn item-btn-red"}>
                        -
                    </button>
                  </td>                 
                  <td>
                    <h1 className="text-center">
                      {cartItem.count}
                    </h1>
                  </td>
                  <td>
                    <button
                      disabled={loading  || cartItem.count === 9}
                      onClick={() => changeCartItemCount(cartItem._id, 1)} 
                      className={cartItem.count === 9 ? "item-btn item-btn-grey" : "item-btn item-btn-green"}>
                        +
                    </button>                               
                  </td>
                </tr>
              </tbody>
            </Table>           
          <span className="item-title">${totalCost}</span>
          <div className="remove-btn-container">
            <span 
              disabled={loading}
              onClick={() => {}}
              className="button-primary button-primary-red">
                Remove Item
            </span>
          </div>
        </td>
      </tr>
    );
  });

  return (
    <div className="cart-page-body">
    <div className="cart-container">    
      <div className="cart-table-container">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th className="text-center cart-heading">Shopping Cart</th>         
            </tr>
          </thead>
          <tbody>
            {renderedCartItems}
          </tbody>
        </Table>   
      </div>
      <div>
        <h1 className="text-center cart-heading">TOTAL COST: {" $"} {totalCost}</h1>
      </div>
      <div className="confirm-order-container">              
        <button className="button-primary button-primary-green">
          <span className="confirm-order">
            CONFIRM ORDER
          </span>
        </button>
      </div>
    </div>    
    </div>
  );
};

export default Cart;