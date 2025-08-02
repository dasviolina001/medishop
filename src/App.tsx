import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Heart, Shield, Truck, CreditCard, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Medicine {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface CartItem extends Medicine {
  quantity: number;
}

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
}

const API_BASE_URL = 'http://localhost/api';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    email: '',
    address: '',
    city: '',
    zipCode: ''
  });
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const goToHome = () => {
    setShowStore(false);
    setIsCartOpen(false);
    setCheckoutStep('cart');
  };

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get_medicines.php`);
        if (!response.ok) throw new Error('Failed to fetch medicines');
        const data = await response.json();
        setMedicines(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === medicine.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== medicineId));
  };

  const updateQuantity = (medicineId: number, change: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === medicineId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0
            ? { ...item, quantity: newQuantity }
            : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep('shipping');
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/submit_order.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: shippingInfo,
          items: cart,
          total: cartTotal,
          payment_method: 'card'
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Order submission failed');
      }

      setCheckoutStep('confirmation');
      setCart([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Order failed. Please try again.');
      console.error('Order submission error:', err);
    }
  };

  const renderCheckoutStep = () => {
    switch (checkoutStep) {
      case 'shipping':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Shipping Information</h3>
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={shippingInfo.name}
                onChange={e => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={shippingInfo.email}
                onChange={e => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Address"
                value={shippingInfo.address}
                onChange={e => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="City"
                value={shippingInfo.city}
                onChange={e => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={shippingInfo.zipCode}
                onChange={e => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          </motion.div>
        );
      case 'payment':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Payment Information</h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Cardholder Name"
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Card Number"
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Expiry MM/YY"
                  required
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  required
                  className="w-24 p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('shipping')}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </motion.div>
        );
      case 'confirmation':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Thank you for your purchase!</h3>
            <p className="mb-6">Your order is confirmed and will be delivered soon.</p>
            <button
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(false);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 flex flex-col h-full"
          >
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 flex-grow flex items-center justify-center">
                Your cart is empty.
              </p>
            ) : (
              <>
                <div className="flex-grow overflow-y-auto mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center mb-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded object-cover mr-4"
                      />
                      <div className="flex-grow">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded hover:bg-gray-200"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded hover:bg-gray-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 ml-4"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total:</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
                    disabled={cart.length === 0}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </motion.div>
        );
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading medicines...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;

  if (!showStore) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-800"
              >
                MediShop
              </motion.h1>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                onClick={() => setShowStore(true)}
              >
                Shop Now
              </motion.button>
            </div>
          </div>
        </header>

        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:w-1/2 lg:pr-12"
              >
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                  Your Health, Our Priority
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Get your medicines delivered right to your doorstep. Safe, reliable, and convenient online pharmacy service.
                </p>
                <button 
                  onClick={() => setShowStore(true)}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors duration-300"
                >
                  Browse Medicines
                </button>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:w-1/2 mt-12 lg:mt-0"
              >
                <img 
                  src="https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=800"
                  alt="Pharmacy"
                  className="rounded-2xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center mb-12"
            >
              Why Choose MediShop?
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Heart className="w-12 h-12 text-blue-500" />,
                  title: "Quality Assured",
                  description: "All medicines are sourced from licensed manufacturers"
                },
                {
                  icon: <Truck className="w-12 h-12 text-blue-500" />,
                  title: "Fast Delivery",
                  description: "Get your medicines delivered within 24 hours"
                },
                {
                  icon: <Shield className="w-12 h-12 text-blue-500" />,
                  title: "Secure Shopping",
                  description: "Your data and transactions are fully protected"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="text-center p-6 rounded-xl bg-blue-50"
                >
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showStore && (
                <button 
                  onClick={goToHome}
                  className="p-1 hover:bg-gray-100 rounded transition"
                  aria-label="Home"
                >
                  <ArrowLeft size={24} className="text-gray-700" />
                </button>
              )}
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-800"
              >
                MediShop
              </motion.h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Open Cart"
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-20">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedicines.length === 0 ? (
            <p className="text-center text-gray-500 col-span-full">No medicines found.</p>
          ) : (
            filteredMedicines.map(medicine => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
              >
                <img
                  src={medicine.image}
                  alt={medicine.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Medicine+Image';
                  }}
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold mb-1">{medicine.name}</h3>
                  <p className="text-gray-500 text-sm flex-grow">{medicine.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-blue-600">₹{medicine.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(medicine)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-xl z-50 flex flex-col"
          >
            <header className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setCheckoutStep('cart');
                }}
                aria-label="Close Cart"
                className="p-2 rounded hover:bg-gray-100 transition"
              >
                <X size={24} />
              </button>
            </header>

            <div className="flex-grow overflow-auto">
              <AnimatePresence>
                {renderCheckoutStep()}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;