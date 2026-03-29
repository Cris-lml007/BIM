<!DOCTYPE html>
<html>

<body style="font-family: sans-serif; background: #f4f4f4; padding: 30px;">
    <div style="max-width:500px; margin:auto; background:#fff; border-radius:8px; padding:30px;">
        <h2>Invitación al proyecto <strong>{{ $projectName }}</strong></h2>
        <p><strong>{{ $invitedBy }}</strong> te ha invitado a colaborar en este proyecto.</p>
        <p>Esta invitación expira el <strong>{{ $expiresAt }}</strong>.</p>
        <a href="{{ $url }}" style="display:inline-block; margin-top:20px; padding:12px 24px;
                  background:#0d6efd; color:#fff; border-radius:6px; text-decoration:none;">
            Aceptar Invitación
        </a>
        <p style="margin-top:20px; color:#888; font-size:12px;">
            Si no esperabas esta invitación, puedes ignorar este correo.
        </p>
    </div>
</body>

</html>