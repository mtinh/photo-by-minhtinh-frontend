export const SET_CART = "SET_CART";
export const UPDATE_QUANTITY = "UPDATE_QUANTITY";
export const CLEAR_CART = "CLEAR_CART";

export const initialCart = { lines: [], itemCount: 0, subtotal: 0, shippingFee: 0, total: 0 };

function cartReducer(state, action) {
    switch (action.type) {
        case SET_CART:
            return action.payload ?? initialCart;

        case UPDATE_QUANTITY:
            return {
                ...state,
                lines: state.lines.map((line) =>
                    line.product.id === action.payload.id
                        ? { ...line, quantity: action.payload.quantity, lineTotal: line.product.price * action.payload.quantity }
                        : line
                ),
            };

        case CLEAR_CART:
            return initialCart;

        default:
            return state;
    }
}

export default cartReducer;
