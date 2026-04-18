@extends('layouts.app')

@section('title', 'Checkout - ' . config('app.name'))

@section('content')
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Order Summary -->
    <div class="lg:col-span-2">
        <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            <div class="p-6 border-b border-white/10">
                <h2 class="text-2xl font-bold">Order Summary</h2>
            </div>

            <div class="p-6 space-y-4">
                @forelse($items as $item)
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                            <h3 class="font-semibold">{{ $item['name'] ?? 'Service' }}</h3>
                            <p class="text-sm text-gray-400 mt-1">{{ $item['description'] ?? 'Cloud service' }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-lg font-bold">${{ number_format($item['price'] ?? 0, 2) }}</p>
                            @if($item['billing_period'] ?? null)
                                <p class="text-xs text-gray-400">{{ $item['billing_period'] }}</p>
                            @endif
                        </div>
                    </div>
                @empty
                    <p class="text-center text-gray-400 py-8">No items in your order</p>
                @endforelse
            </div>
        </div>

        <!-- Coupon Code -->
        <div class="mt-6 backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6">
            <h3 class="font-semibold mb-4">Have a coupon code?</h3>
            <div class="flex gap-2">
                <input type="text" placeholder="Enter code" 
                       class="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400/50">
                <button class="bg-gradient-to-r from-purple-500 to-cyan-400 text-white px-6 py-2 rounded-lg hover:shadow-lg transition">
                    Apply
                </button>
            </div>
        </div>
    </div>

    <!-- Pricing Breakdown -->
    <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl overflow-hidden sticky top-6 h-fit">
        <div class="p-6 border-b border-white/10">
            <h3 class="font-bold text-lg">Pricing Details</h3>
        </div>

        <div class="p-6 space-y-4">
            <div class="flex justify-between">
                <span class="text-gray-400">Subtotal</span>
                <span class="font-semibold">${{ number_format($subtotal ?? 0, 2) }}</span>
            </div>

            <div class="flex justify-between">
                <span class="text-gray-400">Tax</span>
                <span class="font-semibold">${{ number_format($tax ?? 0, 2) }}</span>
            </div>

            @if($discount ?? 0)
                <div class="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-${{ number_format($discount, 2) }}</span>
                </div>
            @endif

            <div class="border-t border-white/10 pt-4 flex justify-between text-lg">
                <span class="font-bold">Total</span>
                <span class="font-bold bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
                    ${{ number_format($total ?? 0, 2) }}
                </span>
            </div>
        </div>

        <!-- Payment Methods -->
        <div class="p-6 border-t border-white/10 space-y-3">
            @if($paymentGateways ?? [])
                @foreach($paymentGateways as $gateway)
                    <button class="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400/50 rounded-lg transition"
                            data-gateway="{{ $gateway->id ?? '' }}">
                        @if($gateway->name === 'Stripe')
                            <i class="fas fa-credit-card text-cyan-400"></i>
                        @elseif($gateway->name === 'PayPal')
                            <i class="fab fa-paypal text-blue-400"></i>
                        @else
                            <i class="fas fa-wallet text-purple-400"></i>
                        @endif
                        <span>{{ $gateway->name ?? 'Payment Method' }}</span>
                    </button>
                @endforeach
            @else
                <button class="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400/50 rounded-lg transition">
                    <i class="fas fa-credit-card text-cyan-400"></i>
                    <span>Pay with Card</span>
                </button>
            @endif
        </div>

        <!-- Terms -->
        <div class="p-6 border-t border-white/10 space-y-4">
            <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 accent-cyan-400">
                <span class="text-sm text-gray-400">
                    I agree to the <a href="#" class="text-cyan-400 hover:text-cyan-300">Terms of Service</a>
                </span>
            </label>

            <button class="w-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                    id="checkout-btn" disabled>
                Complete Purchase
            </button>

            <p class="text-xs text-gray-500 text-center">
                Your payment is secure and encrypted
            </p>
        </div>
    </div>
</div>

<script>
document.getElementById('checkout-btn').addEventListener('click', function() {
    // Validate checkbox
    const termsCheckbox = document.querySelector('input[type="checkbox"]');
    if (!termsCheckbox.checked) {
        alert('Please agree to the Terms of Service');
        return;
    }

    // Get selected payment gateway
    const selectedGateway = document.querySelector('[data-gateway].active')?.dataset.gateway;
    if (!selectedGateway) {
        alert('Please select a payment method');
        return;
    }

    // Process payment
    console.log('Processing payment with gateway:', selectedGateway);
    // Add your payment processing logic here
});

// Enable checkbox
document.querySelector('input[type="checkbox"]').addEventListener('change', function() {
    document.getElementById('checkout-btn').disabled = !this.checked;
});

// Payment gateway selection
document.querySelectorAll('[data-gateway]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('[data-gateway]').forEach(b => b.classList.remove('active', 'bg-cyan-400/20', 'border-cyan-400'));
        this.classList.add('active', 'bg-cyan-400/20', 'border-cyan-400');
    });
});
</script>
@endsection
