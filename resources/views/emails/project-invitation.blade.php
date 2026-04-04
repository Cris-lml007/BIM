<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación al Proyecto</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }

        .header h1 {
            color: #4a90e2;
            margin: 0;
        }

        .content {
            padding: 30px 0;
        }

        .project-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #4a90e2;
        }

        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4a90e2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }

        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
            font-size: 12px;
            color: #666;
        }

        .role-badge {
            display: inline-block;
            background-color: #e9ecef;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>¡Invitación a Proyecto!</h1>
        </div>

        <div class="content">
            <p>Hola,</p>

            <p><strong>{{ $inviter->name }}</strong> te ha invitado a unirte al proyecto:</p>

            <div class="project-info">
                <h3>{{ $project->name }}</h3>
                <p>{{ $project->description ?? 'Sin descripción' }}</p>
                <p>
                    <strong>Rol asignado:</strong>
                    <span class="role-badge">
                        @php
                            $roleValue = $invitation->role ?? $role ?? 1; // Valor por defecto
                            $roleEnum = \App\Enum\RoleProject::tryFrom($roleValue);
                        @endphp
                        {{ $roleEnum?->label() ?? 'Sin rol' }}
                    </span>
                </p>
                <p><strong>Fecha de expiración:</strong> {{ $invitation->expires_at->format('d/m/Y') }}</p>
            </div>

            <p>Para aceptar la invitación y comenzar a colaborar, haz clic en el siguiente botón:</p>

            <center>
                <a href="{{ $acceptUrl ?? route('invitations.accept', $invitation->token) }}" class="btn">
                    Aceptar Invitación
                </a>
            </center>

            <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
            <p>La invitación expirará en 7 días.</p>
        </div>

        <div class="footer">
            <p>Este es un mensaje automático, por favor no responder a este correo.</p>
            <p>&copy; {{ date('Y') }} Tu Empresa. Todos los derechos reservados.</p>
        </div>
    </div>
</body>

</html>