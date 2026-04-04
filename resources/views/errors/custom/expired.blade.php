<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación Expirada</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #070842ff, #0a0096ff);
            background-attachment: fixed;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
        }

        .content-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .icon-circle {
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: transform 0.3s ease;
        }

        .icon-circle:hover {
            transform: scale(1.05);
            background: rgba(255, 255, 255, 0.25);
        }

        .icon-circle i {
            font-size: 55px;
            color: white;
        }

        h2 {
            color: white;
            font-weight: bold;
            margin-bottom: 20px;
            font-size: 2.5rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .text-highlight {
            color: #ffd700;
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 35px;
            opacity: 0.95;
        }

        .btn-home {
            background: white;
            color: #070842ff !important;
            border: none;
            padding: 14px 40px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-home:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            background: #f8f9fa;
            color: #070842ff;
        }

        .btn-home i {
            font-size: 18px;
            color: #070842ff;
        }

        /* Animación de entrada */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .content-wrapper>div {
            animation: fadeInUp 0.6s ease-out;
        }
    </style>
</head>

<body>
    <div class="content-wrapper">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <!-- Icono -->
                    <div class="icon-circle mx-auto">
                        <i class="fas fa-hourglass-half"></i>
                    </div>

                    <!-- Título -->
                    <h2>Invitación Expirada</h2>

                    <!-- Mensaje -->
                    <p class="text-highlight">
                        El enlace de invitación ya no es válido
                    </p>

                    <!-- Botón -->
                    <a href="{{ url('/') }}" class="btn-home">
                        <i class="fas fa-home"></i>
                        Ir al Inicio
                    </a>
                </div>
            </div>
        </div>
    </div>
</body>

</html>