@php
    $base = "btn fw-semibold";

    $types = [
        'primary' => 'bg-dark text-white border border-dark hover:bg-black',
        'secondary' => 'bg-white text-dark border border-gray-300 hover:bg-gray-100',
        'tertiary' => 'bg-transparent text-gray-600 border-0 hover:text-black'
    ];

    $sizes = [
        'sm' => 'btn-sm',
        'md' => '',
        'lg' => 'btn-lg'
    ];
@endphp

<button {{ $attributes->merge([
    'class' => $base . ' ' . ($types[$type] ?? $types['primary']) . ' ' . ($sizes[$size] ?? '')
]) }}>
    {{ $slot }}
</button>